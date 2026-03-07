const archiver = require('archiver');
const { createCheckoutSession, createCustomer } = require('../services/stripeService');
const { Op } = require('sequelize');
const { Resume, Student, HrUser, User, HrTransaction, Interview, Booking, Interviewer } = require('../models');
const { fetchPointsRules, calculateResumeCost } = require('../services/pointsService');
const { fetchLatestPublishedInterviewsByStudent } = require('../utils/interviewHelpers');
const { sendFeedbackNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditLogService');
const fs = require('fs');
const path = require('path');

const listResumes = async (req, res) => {
  const {
    name,
    skills,
    min_rating,
    max_rating,
    min_experience,
    max_experience,
    location
  } = req.query;
  const studentWhere = {};
  const userWhere = {};
  if (skills) {
    const parsedSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsedSkills.length) {
      studentWhere.skills = { [Op.overlap]: parsedSkills };
    }
  }
  if (min_experience || max_experience) {
    studentWhere.experience_years = {};
    if (min_experience) studentWhere.experience_years[Op.gte] = Number(min_experience);
    if (max_experience) studentWhere.experience_years[Op.lte] = Number(max_experience);
  }
  if (location) {
    studentWhere.location = { [Op.iLike]: `%${location}%` };
  }
  if (name) {
    userWhere.name = { [Op.iLike]: `%${name}%` };
  }
  const hr = await HrUser.findOne({ where: { user_id: req.user.id } });
  const rules = await fetchPointsRules();
  const studentInclude = {
    model: Student,
    as: 'Student',
    include: [
      {
        model: User,
        as: 'User',
        ...(Object.keys(userWhere).length ? { where: userWhere } : {})
      }
    ],
    ...(Object.keys(studentWhere).length ? { where: studentWhere } : {})
  };
  const records = await Resume.findAll({
    where: { visible_to_hr: true },
    include: [studentInclude],
    limit: 50
  });
  const studentIds = records.map((resume) => resume.Student?.id).filter(Boolean);
  const latestInterviews = await fetchLatestPublishedInterviewsByStudent(studentIds);

  const parseNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const minRatingValue = parseNumber(min_rating);
  const maxRatingValue = parseNumber(max_rating);

  const filteredRecords = records.filter((resume) => {
    const student = resume.Student;
    const interviewInfo = student ? latestInterviews[student.id] : null;
    const ratingValue = interviewInfo?.overall_rating ?? student?.ratings_avg ?? null;
    if (minRatingValue !== null && (ratingValue === null || ratingValue < minRatingValue)) {
      return false;
    }
    if (maxRatingValue !== null && (ratingValue === null || ratingValue > maxRatingValue)) {
      return false;
    }
    return true;
  });

  const canView = hr?.students_visible !== false;
  const preview = filteredRecords.map((resume) => {
    const student = resume.Student;
    const interviewInfo = student ? latestInterviews[student.id] : null;
    const interviewerRating = interviewInfo?.overall_rating ?? null;
    const ratingForDisplay = interviewerRating ?? student?.ratings_avg ?? null;
    return {
      id: resume.id,
      name: canView ? resume.Student?.User?.name : 'Restricted',
      email: canView ? resume.Student?.User?.email : undefined,
      skills: resume.Student?.skills,
      ratings_avg: resume.Student?.ratings_avg ?? null,
      experience_years: resume.Student?.experience_years ?? null,
      location: resume.Student?.location ?? null,
      interviewer_rating: interviewerRating,
      interview_id: interviewInfo?.id ?? null,
      interview_updated_at: interviewInfo?.updated_at ?? null,
      rating: ratingForDisplay,
      cost_points: calculateResumeCost(resume, rules)
    };
  });
  res.json({ preview });
};

const downloadResume = async (req, res) => {
  const { id } = req.params;
  const hr = await HrUser.findOne({ where: { user_id: req.user.id } });
  if (!hr) return res.status(403).json({ message: 'HR profile missing' });
  const rules = await fetchPointsRules();
  const resume = await Resume.findByPk(id, {
    include: [
      { model: Student, as: 'Student', include: [{ model: User, as: 'User' }] }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  if (!resume.visible_to_hr) return res.status(403).json({ message: 'Resume not published to HR' });
  const cost = calculateResumeCost(resume, rules);
  if (!hr.subscription_active && hr.subscription_points < cost) {
    return res.status(402).json({ message: 'Purchase points or activate subscription' });
  }
  if (!hr.subscription_active) {
    hr.subscription_points -= cost;
  }
  resume.download_count += 1;
  await Promise.all([hr.save(), resume.save()]);
  await HrTransaction.create({
    hr_user_id: hr.id,
    type: 'download',
    credits_change: -cost,
    description: `Downloaded resume ${resume.id}`,
    resume_id: resume.id
  });
  const canView = hr.students_visible !== false;
  const fileName = `${resume.Student?.User?.name || 'resume'}-${resume.id}${path.extname(resume.file_path)}`;
  const absolutePath = path.join(process.cwd(), resume.file_path);

  if (fs.existsSync(absolutePath)) {
      res.download(absolutePath, fileName);
  } else {
      res.json({
        url: resume.file_path,
        candidate: canView ? resume.Student?.User?.name : 'Restricted',
        email: canView ? resume.Student?.User?.email : undefined,
        download_count: resume.download_count,
        cost_points: cost,
        balance: hr.subscription_points,
        message: 'File not found on local disk, using URL'
      });
  }
};

const subscribe = async (req, res) => {
  const { priceId } = req.body;
  if (!priceId) return res.status(400).json({ message: 'priceId required' });
  const hr = await HrUser.findOne({ where: { user_id: req.user.id } });
  if (!hr) return res.status(404).json({ message: 'HR profile missing' });

  let customerId = hr.stripe_customer_id;
  if (!customerId) {
    const customer = await createCustomer({
      email: req.user.email,
      name: req.user.name
    });
    customerId = customer.id;
    hr.stripe_customer_id = customerId;
    await hr.save();
  }

  const session = await createCheckoutSession({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer: customerId,
    metadata: { hr_id: hr.id },
    success_url: `${process.env.FRONTEND_URL}/hr/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/hr/subscription/cancel`
  });
  res.json({ sessionId: session.id, url: session.url });
};

const getHrAnalytics = async (req, res) => {
  const hr = await HrUser.findOne({ where: { user_id: req.user.id } });
  if (!hr) return res.status(404).json({ message: 'HR profile missing' });
  const downloads = await Resume.sum('download_count');
  res.json({
    points: hr.subscription_points,
    subscription_active: hr.subscription_active,
    plan_expiry: hr.plan_expiry,
    totalDownloads: downloads || 0
  });
};

const getResumeCost = async (req, res) => {
  const { id } = req.params;
  const rules = await fetchPointsRules();
  const resume = await Resume.findByPk(id, {
    include: [
      { model: Student, as: 'Student', include: [{ model: User, as: 'User' }] }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const cost = calculateResumeCost(resume, rules);
  const hr = await HrUser.findOne({ where: { user_id: req.user.id } });
  res.json({ cost_points: cost, balance: hr?.subscription_points || 0 });
};

const listPendingFeedback = async (req, res) => {
  const interviews = await Interview.findAll({
    where: { interviewer_feedback_published: false },
    include: [
      {
        model: Booking,
        include: [
          { model: Student, include: [User] },
          { model: Interviewer, include: [User] }
        ]
      }
    ]
  });
  res.json({ interviews });
};

const approveFeedback = async (req, res) => {
  const { id } = req.params;
  const interview = await Interview.findByPk(id, {
    include: [{ model: Booking, include: [Student, { model: Interviewer, include: [User] }] }]
  });
  if (!interview) return res.status(404).json({ message: 'Interview feedback not found' });
  if (interview.interviewer_feedback_published) {
    return res.status(400).json({ message: 'Feedback already published' });
  }

  interview.interviewer_feedback_published = true;
  interview.interviewer_feedback_published_at = new Date();
  await interview.save();

  // Update interviewer rating now (DEF-025)
  const interviewer = interview.Booking?.Interviewer;
  if (interviewer) {
    const prevCount = interviewer.rating_count || 0;
    const prevTotal = (interviewer.average_rating || 0) * prevCount;
    const newCount = prevCount + 1;
    interviewer.average_rating = (prevTotal + Number(interview.overall_rating || 0)) / newCount;
    interviewer.rating_count = newCount;
    await interviewer.save();
  }

  // Notify student
  const studentEmail = interview.Booking?.Student?.User?.email;
  const studentUserId = interview.Booking?.Student?.user_id;
  if (studentEmail) {
    await sendFeedbackNotification({
      bookingId: interview.booking_id,
      to: studentEmail,
      userId: studentUserId
    });
  }

  logAudit(req, 'hr_approve_feedback', { interviewId: interview.id, bookingId: interview.booking_id });
  res.json({ message: 'Feedback approved and published', interview });
};


const bulkDownloadResumes = async (req, res) => {
  const { studentIds } = req.body;
  if (!studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ message: 'studentIds array is required' });
  }

  const resumes = await Resume.findAll({
    where: { student_id: { [Op.in]: studentIds } }
  });

  if (resumes.length === 0) {
    return res.status(404).json({ message: 'No resumes found for selected students' });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="resumes.zip"');

  archive.pipe(res);

  for (const resume of resumes) {
    if (resume.file_content) {
      archive.append(resume.file_content, { name: `${resume.filename || 'resume'}_${resume.student_id}.pdf` });
    }
  }

  await archive.finalize();
};

module.exports = {
  listResumes,
  downloadResume,
  subscribe,
  getHrAnalytics,
  getResumeCost,
  bulkDownloadResumes,
  listPendingFeedback,
  approveFeedback
};
