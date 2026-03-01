const bcrypt = require('bcrypt');
const {
  User,
  Booking,
  Interview,
  Company,
  Student,
  Interviewer,
  HrUser,
  Skill,
  HrTransaction,
  Resume,
  PaymentAudit,
  Course,
  StudentCourse,
  Internship,
  StudentInternship,
  PointsRule,
  QuizCatalog
} = require('../models');
const { generateToken } = require('../utils/jwt');
const { PROFILE_STATUS } = require('../utils/profileStatus');
const {
  getRoleAnalyticsData,
  buildCsv,
  getConsultancyAnalyticsData,
  buildConsultancyCsv,
  buildHrMetrics,
  buildAdminOverview,
  normalizeDateRange,
  buildCourseAnalytics,
  buildInternshipAnalytics,
  buildRoleTrendData,
  buildCourseAnalyticsCsv,
  buildInternshipAnalyticsCsv
} = require('../services/adminAnalyticsService');
const { Op } = require('sequelize');
const { fetchPointsRules, calculateResumeCost } = require('../services/pointsService');
const { sendFeedbackNotification } = require('../services/notificationService');
const PDFDocument = require('pdfkit');
const { logAudit } = require('../services/auditLogService');
const { fetchLatestPublishedInterviewsByStudent } = require('../utils/interviewHelpers');
const normalizeArrayValue = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return value;
};

const createUser = async (req, res) => {
  const { email, password, role, name, phone, profile } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role required' });
  }
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password_hash, role, name, phone });
  if (role === 'student') {
    await Student.create({ user_id: user.id, ...profile });
  } else if (role === 'interviewer') {
    await Interviewer.create({ user_id: user.id, ...profile });
  } else if (role === 'hr') {
    await HrUser.create({ user_id: user.id });
  }
  res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
};

const createStudentProfile = async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    skills,
    endorsed_skills,
    experience_years,
    education,
    projects,
    hobbies,
    resume_file,
    location
  } = req.body;
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password_hash, role: 'student', name, phone });
  const student = await Student.create({
    user_id: user.id,
    skills: skills || [],
    endorsed_skills: endorsed_skills || [],
    experience_years: experience_years ?? 0,
    education: education || [],
    projects: projects || [],
    hobbies: hobbies || [],
    resume_file: resume_file || null,
    location: location || null
  });
  logAudit(req, 'create_student_profile', { studentId: student.id, userId: user.id, email });
  res.status(201).json({ user, student });
};

const createInterviewerProfile = async (req, res) => {
const {
  email,
  password,
  name,
  phone,
  company_id,
  title,
  skill_set,
  availability_slots,
  experience_years,
  bio,
  rate,
  projects,
  hobbies,
  meeting_link
} = req.body;
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password_hash, role: 'interviewer', name, phone });
  const defaultInterviewerRate = Interviewer.rawAttributes?.rate?.defaultValue ?? 1000;
  const interviewer = await Interviewer.create({
    user_id: user.id,
    company_id,
    title: title || 'Interviewer',
    skill_set: skill_set || [],
    availability_slots: availability_slots || [],
    experience_years: experience_years ?? 0,
    bio: bio || '',
    rate: rate ?? defaultInterviewerRate,
    meeting_link: meeting_link || null,
    projects: projects || [],
    hobbies: hobbies || []
  });
  logAudit(req, 'create_interviewer_profile', {
    interviewerId: interviewer.id,
    userId: user.id,
    email,
    companyId: company_id
  });
  res.status(201).json({ user, interviewer });
};

const getAnalytics = async (req, res) => {
  const bookings = await Booking.findAll({});
  const reviews = await Interview.findAll({});
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length : 0;
  const companies = await Company.findAll({
    attributes: ['id', 'name'],
    include: [{ model: Interviewer, include: [{ model: Booking, attributes: ['id'] }] }]
  });
  res.json({ bookingCount: bookings.length, totalRevenue, avgRating, companies });
};

const createCompany = async (req, res) => {
  const { name, published = false, offers_internships = false } = req.body;
  if (!name) return res.status(400).json({ message: 'Company name required' });
  const company = await Company.create({
    name,
    published: Boolean(published),
    offers_internships: Boolean(offers_internships)
  });
  res.status(201).json(company);
};

const listCompanies = async (req, res) => {
  const companies = await Company.findAll({ order: [['name', 'ASC']] });
  res.json(companies);
};

const createCourse = async (req, res) => {
  const {
    name,
    level,
    duration_weeks,
    description,
    published = true,
    instructor_name,
    instructor_title,
    instructor_email,
    instructor_bio
  } = req.body;
  if (!name) return res.status(400).json({ message: 'Course name required' });
  const course = await Course.create({
    name,
    level,
    duration_weeks,
    description,
    published,
    instructor_name,
    instructor_title,
    instructor_email,
    instructor_bio
  });
  res.status(201).json(course);
};

const listCourses = async (req, res) => {
  const courses = await Course.findAll({
    include: [
      {
        model: StudentCourse,
        as: 'StudentCourses',
        include: [{ model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }]
      }
    ],
    order: [['name', 'ASC']]
  });
  res.json({
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      level: course.level,
      duration_weeks: course.duration_weeks,
      description: course.description,
      published: course.published,
      registrations: course.StudentCourses?.length || 0,
      instructor: course.instructor_name || course.instructor_email
        ? {
            name: course.instructor_name,
            title: course.instructor_title,
            email: course.instructor_email,
            bio: course.instructor_bio
          }
        : null
    }))
  });
};

const toggleCoursePublish = async (req, res) => {
  const { id } = req.params;
  const { published } = req.body;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  course.published = published === undefined ? !course.published : Boolean(published);
  await course.save();
  res.json(course);
};

const getCourseRegistrations = async (req, res) => {
  const { id } = req.params;
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  const registrations = await StudentCourse.findAll({
    where: { course_id: course.id },
    include: [{ model: Student, include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }] }]
  });
  res.json({
    course: {
      id: course.id,
      name: course.name,
      level: course.level,
      description: course.description
    },
    registrations: registrations.map((entry) => {
      const student = entry.Student;
      return {
        id: entry.id,
        status: entry.status,
        student: student
          ? {
              id: student.id,
              name: student.User?.name || student.name,
              email: student.User?.email,
              phone: student.User?.phone,
              skills: student.skills,
              experience_years: student.experience_years,
              location: student.location
            }
          : null
      };
    })
  });
};

const getCourseAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await buildCourseAnalytics({ startDate, endDate });
  res.json(analytics);
};

const exportCourseAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await buildCourseAnalytics({ startDate, endDate });
  const csv = buildCourseAnalyticsCsv(analytics);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="course-analytics.csv"`);
  res.send(csv);
};

const createSkill = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Skill name required' });
  const skill = await Skill.create({ name });
  res.status(201).json(skill);
};

const listSkills = async (req, res) => {
  const skills = await Skill.findAll({ order: [['name', 'ASC']] });
  res.json(skills);
};

const createInternship = async (req, res) => {
  const { title, company_id, description, duration_months, location, skills = [], published = false } = req.body;
  if (!title || !company_id) {
    return res.status(400).json({ message: 'Title and company_id required' });
  }
  const parsedSkills = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
      ? skills.split(',').map((skill) => skill.trim()).filter(Boolean)
      : [];
  const internship = await Internship.create({
    title,
    company_id,
    description,
    duration_months,
    location,
    skills: parsedSkills,
    published: Boolean(published)
  });
  res.status(201).json(internship);
};

const listInternships = async (req, res) => {
  const internships = await Internship.findAll({
    include: [
      { model: Company, as: 'Company', attributes: ['id', 'name'] },
      {
        model: StudentInternship,
        as: 'Registrations',
        include: [{ model: Student, as: 'Student', include: [{ model: User, attributes: ['id', 'name', 'email'] }] }]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  res.json({
    internships: internships.map((internship) => ({
      id: internship.id,
      title: internship.title,
      description: internship.description,
      duration_months: internship.duration_months,
      location: internship.location,
      skills: internship.skills,
      published: internship.published,
      company: internship.Company?.name,
      registrations: internship.Registrations?.length || 0
    }))
  });
};

const toggleInternshipPublish = async (req, res) => {
  const { id } = req.params;
  const { published } = req.body;
  const internship = await Internship.findByPk(id);
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  internship.published = published === undefined ? !internship.published : Boolean(published);
  await internship.save();
  res.json(internship);
};

const getInternshipRegistrations = async (req, res) => {
  const { id } = req.params;
  const internship = await Internship.findByPk(id);
  if (!internship) return res.status(404).json({ message: 'Internship not found' });
  const registrations = await StudentInternship.findAll({
    where: { internship_id: internship.id },
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] }]
      }
    ]
  });
  res.json({
    internship: {
      id: internship.id,
      title: internship.title,
      company: internship.company,
      location: internship.location,
      duration_months: internship.duration_months
    },
    registrations: registrations.map((entry) => {
      const student = entry.Student;
      return {
        id: entry.id,
        status: entry.status,
        desired_skills: entry.desired_skills,
        purpose: entry.purpose,
        duration_months: entry.duration_months,
        start_date: entry.start_date,
        student: student
          ? {
              id: student.id,
              name: student.User?.name || student.name,
              email: student.User?.email,
              phone: student.User?.phone,
              skills: student.skills,
              experience_years: student.experience_years,
              location: student.location
            }
          : null
      };
    })
  });
};

const listInternshipRegistrations = async (req, res) => {
  const registrations = await StudentInternship.findAll({
    include: [
      { model: Student, as: 'Student', include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
      {
        model: Internship,
        as: 'Internship',
        include: [{ model: Company, as: 'Company', attributes: ['name'] }]
      }
    ],
    order: [['created_at', 'DESC']],
    limit: 200
  });
  res.json({
    registrations: registrations.map((reg) => ({
      id: reg.id,
      student: reg.Student?.User?.name,
      email: reg.Student?.User?.email,
      internship: reg.Internship?.title,
      company: reg.Internship?.Company?.name,
      status: reg.status,
      desired_skills: reg.desired_skills,
      purpose: reg.purpose,
      duration_months: reg.duration_months,
      start_date: reg.start_date,
      created_at: reg.created_at
    }))
  });
};

const getInternshipAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await buildInternshipAnalytics({ startDate, endDate });
  res.json(analytics);
};

const exportInternshipAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await buildInternshipAnalytics({ startDate, endDate });
  const csv = buildInternshipAnalyticsCsv(analytics);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="internship-analytics.csv"`);
  res.send(csv);
};

const getRoleAnalytics = async (req, res) => {
  const { role = 'interviewer', startDate, endDate } = req.query;
  const data = await getRoleAnalyticsData(role, { startDate, endDate });
  res.json(data);
};

const getRoleTrend = async (req, res) => {
  const { role = 'interviewer', startDate, endDate } = req.query;
  const trend = await buildRoleTrendData({ role, startDate, endDate });
  res.json({ trend });
};

const listPaymentAudits = async (req, res) => {
  const { startDate, endDate, status } = req.query;
  const where = {};
  if (status) {
    where.status = status;
  }
  if (startDate || endDate) {
    const { from, to } = normalizeDateRange(startDate, endDate);
    where.created_at = { [Op.between]: [from, to] };
  }
  const audits = await PaymentAudit.findAll({
    where,
    include: [
      {
        model: Booking,
        include: [
          {
            model: Interviewer,
            include: [{ model: User, attributes: ['name'] }]
          }
        ]
      },
      {
        model: Student,
        include: [{ model: User, attributes: ['name', 'email'] }]
      }
    ],
    order: [['created_at', 'DESC']],
    limit: 200
  });
  res.json({ audits });
};

const exportRoleAnalytics = async (req, res) => {
  const { role = 'interviewer', startDate, endDate } = req.query;
  const data = await getRoleAnalyticsData(role, { startDate, endDate });
  const csv = buildCsv(role, data);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${role}-analytics.csv"`);
  res.send(csv);
};

const exportFeedbackHistory = async (req, res) => {
  const interviews = await Interview.findAll({
    include: [
      {
        model: Booking,
        include: [
          { model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
          { model: Interviewer, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }
        ]
      }
    ],
    order: [['updated_at', 'DESC']],
    limit: 500
  });
  const students = await Student.findAll({
    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    order: [['updated_at', 'DESC']],
    limit: 500
  });
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['Type', 'ID', 'Date', 'Student', 'Interviewer/Notes', 'Rating', 'Details'];
  const rows = [];
  interviews.forEach((interview) => {
    const booking = interview.Booking;
    const student = booking?.Student;
    const interviewer = booking?.Interviewer;
    rows.push([
      'interview',
      interview.id,
      interview.updated_at?.toISOString() || '',
      student?.User?.name || 'n/a',
      interviewer?.User?.name || 'n/a',
      interview.overall_rating ?? '',
      `Skill comments: ${JSON.stringify(interview.skill_comments || {})}; Feedback: ${interview.feedback || ''}; Improve areas: ${
        interview.improve_areas || ''
      }`
    ]);
  });
  students.forEach((student) => {
    rows.push([
      'student',
      student.id,
      student.updated_at?.toISOString() || '',
      student.User?.name || 'n/a',
      student.resume_file || '',
      student.ratings_avg ?? '',
      `Skills: ${(student.skills || []).join(', ') || 'n/a'}; Endorsed: ${(student.endorsed_skills ||
        []).join(', ') || 'n/a'}`
    ]);
  });
  const csv = [header.map(quote).join(','), ...rows.map((row) => row.map(quote).join(','))].join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="feedback-history.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
};

const listBookingsWithFeedback = async (req, res) => {
  const { role, userId, studentId, interviewerId, startDate, endDate, status } = req.query;
  const bookingWhere = {};
  if (role === 'student' && userId) {
    bookingWhere.student_id = userId;
  }
  if (role === 'interviewer' && userId) {
    bookingWhere.interviewer_id = userId;
  }
  if (studentId) {
    bookingWhere.student_id = studentId;
  }
  if (interviewerId) {
    bookingWhere.interviewer_id = interviewerId;
  }
  if (status) {
    bookingWhere.status = status;
  }
  if (startDate || endDate) {
    const { from, to } = normalizeDateRange(startDate, endDate);
    bookingWhere.slot_time = { [Op.between]: [from, to] };
  }
  const bookings = await Booking.findAll({
    where: bookingWhere,
    order: [['slot_time', 'DESC']],
    include: [
      {
        model: Student,
        include: [
          { model: User, attributes: ['id', 'name', 'email'] },
          { model: Resume, as: 'Resumes', attributes: ['id', 'file_path', 'download_count'] }
        ]
      },
      {
        model: Interviewer,
        include: [{ model: User, attributes: ['id', 'name', 'email'] }]
      },
      {
        model: Interview,
        as: 'interviewDetails'
      }
    ]
  });
  const payload = bookings.map((booking) => ({
    id: booking.id,
    slot_time: booking.slot_time,
    amount: booking.amount,
    status: booking.status,
    interview: booking.interviewDetails,
    student: {
      id: booking.Student?.id,
      name: booking.Student?.User?.name,
      email: booking.Student?.User?.email,
      resumes: (booking.Student?.Resumes || []).map((resume) => ({
        id: resume.id,
        file_path: resume.file_path,
        download_count: resume.download_count
      }))
    },
    interviewer: {
      id: booking.Interviewer?.id,
      name: booking.Interviewer?.User?.name,
      email: booking.Interviewer?.User?.email
    }
  }));
  res.json({ bookings: payload });
};

const getConsultancyAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await getConsultancyAnalyticsData({ startDate, endDate });
  res.json({ consultancies: analytics.consultancies, summary: analytics.summary });
};

const exportConsultancyAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  const analytics = await getConsultancyAnalyticsData({ startDate, endDate });
  const csv = buildConsultancyCsv(analytics);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="consultancy-analytics.csv"');
  res.send(csv);
};

const getAdminOverview = async (req, res) => {
  const { startDate, endDate } = req.query;
  const overview = await buildAdminOverview({ startDate, endDate });
  res.json(overview);
};

const pipelineStages = ['shortlisted', 'interviewing', 'offered', 'rejected'];

const getHrPipeline = async (req, res) => {
  const students = await Student.findAll({
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
      {
        model: Booking,
        include: [
          {
            model: Interview,
            as: 'interviewDetails'
          }
        ]
      }
    ],
    order: [['updated_at', 'DESC']]
  });
  const columns = pipelineStages.reduce((acc, stage) => ({ ...acc, [stage]: [] }), {});
  students.forEach((student) => {
    const stage = student.pipeline_stage || 'shortlisted';
    const pipelineItem = {
      id: student.id,
      name: student.User?.name || 'Unknown',
      email: student.User?.email,
      skills: student.skills || [],
      bookings: student.Bookings?.length || 0,
      profileStatus: student.profile_status,
      updatedAt: student.updated_at
    };
    pipelineItem.profileStage = stage;
    columns[stage]?.push(pipelineItem);
  });
  res.json({ columns });
};

const moveHrPipelineStage = async (req, res) => {
  const { studentId } = req.params;
  const { stage } = req.body;
  if (!pipelineStages.includes(stage)) {
    return res.status(400).json({ message: 'Invalid pipeline stage' });
  }
  const student = await Student.findByPk(studentId, {
    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
  });
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  student.pipeline_stage = stage;
  await student.save();
  logAudit(req, 'pipeline_stage_move', {
    studentId: student.id,
    stage,
    adminId: req.user?.id
  });
  res.json({ student });
};

const addConsultancyCredits = async (req, res) => {
  const { hrId } = req.params;
  const { points, note } = req.body;
  const parsedPoints = Number(points);
  if (!parsedPoints || parsedPoints <= 0) {
    return res.status(400).json({ message: 'Points must be a positive number' });
  }
  const hr = await HrUser.findByPk(hrId);
  if (!hr) return res.status(404).json({ message: 'Consultancy not found' });
  hr.subscription_points += parsedPoints;
  await hr.save();
  await HrTransaction.create({
    hr_user_id: hr.id,
    type: 'credit_add',
    credits_change: parsedPoints,
    description: note || 'Admin credit adjustment'
  });
  res.json({ hr });
};

const updateConsultancyStatus = async (req, res) => {
  const { hrId } = req.params;
  const { active } = req.body;
  const hr = await HrUser.findByPk(hrId);
  if (!hr) return res.status(404).json({ message: 'Consultancy not found' });
  if (active !== undefined) {
    hr.subscription_active = Boolean(active);
  }
  if (req.body.students_visible !== undefined) {
    hr.students_visible = Boolean(req.body.students_visible);
  }
  await hr.save();
  res.json({ hr });
};

const updateInterviewer = async (req, res) => {
  const { id } = req.params;
  const { company_id, skill_set, availability_slots, experience_years, bio, meeting_link } = req.body;
  const interviewer = await Interviewer.findByPk(id);
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  interviewer.company_id = company_id ?? interviewer.company_id;
  interviewer.skill_set = skill_set ?? interviewer.skill_set;
  interviewer.availability_slots = availability_slots ?? interviewer.availability_slots;
  interviewer.experience_years = experience_years ?? interviewer.experience_years;
  interviewer.bio = bio ?? interviewer.bio;
  interviewer.meeting_link = meeting_link ?? interviewer.meeting_link;
  await interviewer.save();
  res.json(interviewer);
};

const updateStudentProfile = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    skills,
    endorsed_skills,
    experience_years,
    education,
    projects,
    hobbies,
    resume_file,
    location,
    email
  } = req.body;
  const student = await Student.findByPk(id, { include: [{ model: User }] });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const user = student.User;
  if (email && email !== user.email) {
    const emailTaken = await User.findOne({ where: { email } });
    if (emailTaken) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    user.email = email;
  }
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  student.skills = skills !== undefined ? normalizeArrayValue(skills) : student.skills;
  student.endorsed_skills =
    endorsed_skills !== undefined ? normalizeArrayValue(endorsed_skills) : student.endorsed_skills;
  student.experience_years = experience_years !== undefined ? experience_years : student.experience_years;
  student.education = education !== undefined ? education : student.education;
  student.projects = projects !== undefined ? projects : student.projects;
  student.hobbies = hobbies !== undefined ? normalizeArrayValue(hobbies) : student.hobbies;
  student.resume_file = resume_file !== undefined ? resume_file : student.resume_file;
  student.location = location !== undefined ? location : student.location;
  await Promise.all([student.save(), user?.save()]);
  logAudit(req, 'update_student_profile', { studentId: student.id, userId: user?.id });
  res.json({ student });
};

const updateInterviewerProfile = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    company_id,
    title,
    skill_set,
    availability_slots,
    experience_years,
    bio,
    rate,
    projects,
    hobbies,
    meeting_link,
    email
  } = req.body;
  const interviewer = await Interviewer.findByPk(id, { include: [{ model: User }] });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  const user = interviewer.User;
  if (email && email !== user.email) {
    const emailTaken = await User.findOne({ where: { email } });
    if (emailTaken) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    user.email = email;
  }
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  interviewer.company_id = company_id ?? interviewer.company_id;
  interviewer.title = title ?? interviewer.title;
  interviewer.skill_set = skill_set !== undefined ? normalizeArrayValue(skill_set) : interviewer.skill_set;
  interviewer.availability_slots = availability_slots ?? interviewer.availability_slots;
  interviewer.experience_years = experience_years !== undefined ? experience_years : interviewer.experience_years;
  interviewer.bio = bio !== undefined ? bio : interviewer.bio;
  interviewer.rate = rate !== undefined ? rate : interviewer.rate;
  interviewer.meeting_link = meeting_link !== undefined ? meeting_link : interviewer.meeting_link;
  interviewer.projects = projects !== undefined ? projects : interviewer.projects;
  interviewer.hobbies = hobbies !== undefined ? normalizeArrayValue(hobbies) : interviewer.hobbies;
  await Promise.all([interviewer.save(), user?.save()]);
  logAudit(req, 'update_interviewer_profile', { interviewerId: interviewer.id, userId: user?.id });
  res.json({ interviewer });
};

const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, published, offers_internships } = req.body;
  const company = await Company.findByPk(id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  if (name) company.name = name;
  if (published !== undefined) company.published = Boolean(published);
  if (offers_internships !== undefined) {
    company.offers_internships = Boolean(offers_internships);
  }
  await company.save();
  res.json(company);
};

const toggleCompanyPublish = async (req, res) => {
  const { id } = req.params;
  const { published } = req.body;
  const company = await Company.findByPk(id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  company.published = published === undefined ? !company.published : Boolean(published);
  await company.save();
  res.json(company);
};

const updateSkill = async (req, res) => {
  const { id } = req.params;
  const { name, published } = req.body;
  const skill = await Skill.findByPk(id);
  if (!skill) return res.status(404).json({ message: 'Skill not found' });
  if (name) skill.name = name;
  if (published !== undefined) skill.published = Boolean(published);
  await skill.save();
  res.json(skill);
};

const toggleSkillPublish = async (req, res) => {
  const { id } = req.params;
  const { published } = req.body;
  const skill = await Skill.findByPk(id);
  if (!skill) return res.status(404).json({ message: 'Skill not found' });
  skill.published = published === undefined ? !skill.published : Boolean(published);
  await skill.save();
  res.json(skill);
};

const createBookingOnBehalf = async (req, res) => {
  const {
    student_user_id,
    student_id,
    interviewer_id,
    slot_time,
    company_id,
    skill,
    notes,
    amount,
    status = 'pending'
  } = req.body;
  if (!slot_time || !interviewer_id) {
    return res.status(400).json({ message: 'Slot time and interviewer are required' });
  }
  const parsedSlot = new Date(slot_time);
  if (Number.isNaN(parsedSlot.getTime())) {
    return res.status(400).json({ message: 'Invalid slot time' });
  }
  const student = student_id
    ? await Student.findByPk(student_id)
    : await Student.findOne({ where: { user_id: student_user_id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const interviewer = await Interviewer.findByPk(interviewer_id);
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  if (company_id && interviewer.company_id !== Number(company_id)) {
    return res.status(400).json({ message: 'Interviewer does not belong to the selected company' });
  }
  const booking = await Booking.create({
    student_id: student.id,
    interviewer_id,
    slot_time: parsedSlot,
    amount: Number(amount ?? interviewer.rate ?? 1000),
    status,
    notes: notes || (skill ? `Skill focus: ${skill}` : undefined)
  });
  logAudit(req, 'create_booking_on_behalf', {
    studentId: student.id,
    interviewerId: interviewer.id,
    slotTime: parsedSlot.toISOString(),
    skill,
    adminId: req.user?.id
  });
  res.status(201).json({ message: 'Booking scheduled', booking });
};

const adminCompleteInterview = async (req, res) => {
  const { bookingId } = req.params;
  const { skill_ratings = {}, skill_comments = {}, overall_rating, feedback, improve_areas = [] } = req.body;
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Interviewer, include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
      { model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }
    ]
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.status = 'completed';
  await booking.save();
  const [interview] = await Interview.upsert(
    {
      booking_id: booking.id,
      skill_ratings,
      skill_comments,
      overall_rating,
      feedback,
      improve_areas,
      interviewer_feedback_published: true,
      interviewer_feedback_published_at: new Date()
    },
    { returning: true }
  );
  logAudit(req, 'admin_complete_interview', {
    bookingId: booking.id,
    interviewId: interview.id,
    adminId: req.user?.id
  });
  await sendFeedbackNotification({
    bookingId: booking.id,
    to: booking.Student?.User?.email,
    userId: booking.Student?.user_id
  });
  res.json({ interview });
};

const startInterview = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ message: 'Only pending bookings can be started' });
  }
  booking.status = 'in_progress';
  await booking.save();
  logAudit(req, 'start_interview', { bookingId, adminId: req.user?.id });
  res.json({ booking });
};

const listInterviewers = async (req, res) => {
  const { company_id, skill } = req.query;
  const where = {
    profile_status: 'approved',
    is_active: true
  };
  if (company_id) {
    const parsedCompany = Number(company_id);
    if (!Number.isNaN(parsedCompany)) {
      where.company_id = parsedCompany;
    }
  }
  if (skill) {
    const trimmedSkill = String(skill || '').trim();
    if (trimmedSkill) {
      where.skill_set = { [Op.contains]: [trimmedSkill] };
    }
  }
  const interviewers = await Interviewer.findAll({
    where,
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
      { model: Company, attributes: ['id', 'name'] }
    ]
  });
  const TOP_RATED_THRESHOLD = 4.6;
  const MIN_RATING_COUNT = 3;
  const enriched = interviewers.map((interviewer) => {
    const plain = interviewer.get({ plain: true });
    const badge =
      plain.rating_count >= MIN_RATING_COUNT && (plain.average_rating ?? 0) >= TOP_RATED_THRESHOLD
        ? 'Top Rated Interviewer'
        : null;
    return { ...plain, badge };
  });
  res.json(enriched);
};

const exportReports = async (req, res) => {
  const [bookings, interviews, students, interviewerProfiles] = await Promise.all([
    Booking.findAll({
      include: [
        { model: Student, include: [{ model: User, attributes: ['name', 'email'] }] },
        {
          model: Interviewer,
          include: [
            { model: User, attributes: ['name'] },
            { model: Company, attributes: ['name'] }
          ]
        }
      ]
    }),
    Interview.findAll({ include: [{ model: Booking }] }),
    Student.findAll({
      include: [{ model: User, attributes: ['name', 'email'] }]
    }),
    Interviewer.findAll({
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: Company, attributes: ['name'] }
      ]
    })
  ]);
  const hrMetrics = await buildHrMetrics({});
  const skillByCompany = interviewerProfiles.reduce((acc, interviewer) => {
    const companyName = interviewer.Company?.name || 'Independent';
    (interviewer.skill_set || []).forEach((skill) => {
      if (!skill) return;
      acc[companyName] = acc[companyName] || {};
      acc[companyName][skill] = (acc[companyName][skill] || 0) + 1;
    });
    return acc;
  }, {});
  const report = {
    bookings: bookings.map((booking) => ({
      id: booking.id,
      student: booking.Student?.User?.name,
      interviewer: booking.Interviewer?.User?.name,
      company: booking.Interviewer?.Company?.name,
      slot_time: booking.slot_time,
      amount: booking.amount,
      status: booking.status
    })),
    interviews: interviews.map((interview) => ({
      booking_id: interview.booking_id,
      overall_rating: interview.overall_rating,
      skill_ratings: interview.skill_ratings,
      skill_comments: interview.skill_comments
    })),
    profiles: {
      students: students.map((student) => ({
        id: student.id,
        name: student.User?.name,
        email: student.User?.email,
        profile_status: student.profile_status,
        skills: student.skills,
        hobbies: student.hobbies,
        resume_file: student.resume_file,
        submitted_at: student.profile_submitted_at,
        is_active: student.is_active
      })),
      interviewers: interviewerProfiles.map((interviewer) => ({
        id: interviewer.id,
        name: interviewer.User?.name,
        email: interviewer.User?.email,
        company: interviewer.Company?.name,
        profile_status: interviewer.profile_status,
        skill_set: interviewer.skill_set,
        hobbies: interviewer.hobbies,
        projects: interviewer.projects,
        submitted_at: interviewer.profile_submitted_at,
        is_active: interviewer.is_active
      }))
    },
    skillByCompany,
    consultancies: hrMetrics.consultancies,
    consultancySummary: hrMetrics.summary
  };
  res.json(report);
};

  const listUsers = async (req, res) => {
    const [students, interviewers] = await Promise.all([
      Student.findAll({
        include: [
          { model: User, attributes: ['id', 'name', 'email', 'role'] },
          { model: Resume, as: 'Resumes' }
        ]
      }),
      Interviewer.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'role'] },
        { model: Company, attributes: ['id', 'name'] }
      ]
    })
  ]);
    const studentIds = students.map((student) => student.id).filter(Boolean);
    const latestStudentInterviews = await fetchLatestPublishedInterviewsByStudent(studentIds);

    res.json({
      students: students.map((student) => ({
        id: student.id,
        userId: student.user_id,
        name: student.User?.name,
        email: student.User?.email,
        role: student.User?.role,
        profile_status: student.profile_status,
        skills: student.skills,
        experience_years: student.experience_years,
        projects: student.projects,
        hobbies: student.hobbies,
        is_active: student.is_active,
        ratings_avg: student.ratings_avg,
        location: student.location,
        location: student.location,
        latest_interview_rating: latestStudentInterviews[student.id]?.overall_rating ?? null,
        latest_interview_id: latestStudentInterviews[student.id]?.id ?? null,
        latest_interview_updated_at: latestStudentInterviews[student.id]?.updated_at ?? null,
        activation_reason: student.activation_reason,
        deactivation_reason: student.deactivation_reason,
        resume_uploaded: Boolean(student.resume_file) || (student.Resumes?.length || 0) > 0,
        resumes: (student.Resumes || []).map((resume) => ({
        id: resume.id,
        file_path: resume.file_path,
        download_count: resume.download_count,
        created_at: resume.created_at,
        visible_to_hr: resume.visible_to_hr
      }))
    })),
      interviewers: interviewers.map((interviewer) => ({
        id: interviewer.id,
        userId: interviewer.user_id,
        name: interviewer.User?.name,
        email: interviewer.User?.email,
        role: interviewer.User?.role,
        company: interviewer.Company?.name,
        skill_set: interviewer.skill_set,
        profile_status: interviewer.profile_status,
        is_active: interviewer.is_active,
        meeting_link: interviewer.meeting_link,
        average_rating: interviewer.average_rating,
      activation_reason: interviewer.activation_reason,
      deactivation_reason: interviewer.deactivation_reason,
      rate: interviewer.rate,
      availability_slots: interviewer.availability_slots
    }))
  });
};

  const listStudentProfiles = async (req, res) => {
    const { skills, min_experience, max_experience, location } = req.query;
  const studentWhere = {};
  if (skills) {
    studentWhere.skills = { [Op.overlap]: skills.split(',').map((s) => s.trim()) };
  }
  if (min_experience) {
    studentWhere.experience_years = { ...(studentWhere.experience_years || {}), [Op.gte]: Number(min_experience) };
  }
  if (max_experience) {
    studentWhere.experience_years = { ...(studentWhere.experience_years || {}), [Op.lte]: Number(max_experience) };
  }
  if (location) {
    studentWhere.location = { [Op.iLike]: `%${location}%` };
  }
    const students = await Student.findAll({
      where: Object.keys(studentWhere).length ? studentWhere : undefined,
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'phone', 'role'] },
        { model: Resume, as: 'Resumes' }
      ],
      order: [['created_at', 'DESC']]
    });
    const studentIds = students.map((student) => student.id).filter(Boolean);
    const latestStudentInterviews = await fetchLatestPublishedInterviewsByStudent(studentIds);

    res.json({
      students: students.map((student) => ({
        id: student.id,
        userId: student.user_id,
        name: student.User?.name,
        email: student.User?.email,
      phone: student.User?.phone,
      profile_status: student.profile_status,
      skills: student.skills,
      experience_years: student.experience_years,
      projects: student.projects,
      hobbies: student.hobbies,
        is_active: student.is_active,
        ratings_avg: student.ratings_avg,
        latest_interview_rating: latestStudentInterviews[student.id]?.overall_rating ?? null,
        latest_interview_id: latestStudentInterviews[student.id]?.id ?? null,
        latest_interview_updated_at: latestStudentInterviews[student.id]?.updated_at ?? null,
        resume_uploaded: Boolean(student.resume_file) || (student.Resumes?.length || 0) > 0,
        resumes: (student.Resumes || []).map((resume) => ({
        id: resume.id,
        file_path: resume.file_path,
        download_count: resume.download_count,
        created_at: resume.created_at,
        visible_to_hr: resume.visible_to_hr
      }))
    }))
  });
};

const getStudentDetail = async (req, res) => {
  const { id } = req.params;
  const student = await Student.findByPk(id, {
    include: [
      { model: User, attributes: ['id', 'name', 'email', 'phone'] },
      { model: Resume, as: 'Resumes' }
    ]
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentCourses = await StudentCourse.findAll({
    where: { student_id: student.id },
    include: [{ model: Course, attributes: ['id', 'name', 'level', 'description'] }]
  });
  const studentInternships = await StudentInternship.findAll({
    where: { student_id: student.id }
  });
  const internshipIds = studentInternships.map((entry) => entry.internship_id).filter(Boolean);
  let internshipMap = {};
  if (internshipIds.length > 0) {
    try {
      const internshipRecords = await Internship.findAll({
        where: { id: { [Op.in]: internshipIds } },
        attributes: ['id', 'title', 'company', 'location', 'duration_months']
      });
      internshipMap = internshipRecords.reduce((acc, internship) => {
        acc[internship.id] = internship;
        return acc;
      }, {});
    } catch (err) {
      console.error('Failed to load internships for student detail', err);
    }
  }
  const bookings = await Booking.findAll({
    where: { student_id: student.id },
    include: [
      { model: Interviewer, include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: Company, attributes: ['id', 'name'] }] },
      { model: Interview, as: 'interviewDetails' }
    ],
    order: [['slot_time', 'DESC']]
  });
  const resumeIds = (student.Resumes || []).map((resume) => resume.id).filter(Boolean);
  const hrDownloads = resumeIds.length
    ? await HrTransaction.findAll({
        where: {
          type: 'download',
          resume_id: { [Op.in]: resumeIds }
        },
        include: [
          {
            model: HrUser,
            as: 'hrUser',
            include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email'] }]
          }
        ],
        order: [['created_at', 'DESC']]
      })
    : [];
  const totalResumeDownloads = (student.Resumes || []).reduce(
    (sum, resume) => sum + (resume.download_count || 0),
    0
  );
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length;
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;
  const revenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const ratedBookings = bookings.filter((booking) => booking.interviewDetails?.overall_rating !== undefined && booking.interviewDetails?.overall_rating !== null);
  const avgRating =
    ratedBookings.length > 0
      ? ratedBookings.reduce((sum, booking) => sum + (booking.interviewDetails?.overall_rating || 0), 0) /
        ratedBookings.length
      : null;
  const pointsSpent = hrDownloads.reduce(
    (sum, txn) => sum + Math.abs(txn.credits_change || 0),
    0
  );
  const uniqueHrCount = new Set(hrDownloads.map((txn) => txn.hr_user_id)).size;
  const skillBadgeThreshold = 4.5;
  const skillBadges = [];
  const seenSkills = new Set();
  bookings.forEach((booking) => {
    const ratings = booking.interviewDetails?.skill_ratings;
    if (ratings && typeof ratings === 'object') {
      Object.entries(ratings).forEach(([skill, rating]) => {
        if (rating >= skillBadgeThreshold && !seenSkills.has(skill)) {
          seenSkills.add(skill);
          skillBadges.push({ skill, rating: Number(rating.toFixed?.(1) ?? rating) });
        }
      });
    }
  });
  const analytics = {
    skill_badges: skillBadges,
    bookings_total: bookings.length,
    bookings_completed: completedBookings,
    bookings_pending: pendingBookings,
    revenue,
    avg_rating: avgRating,
    resume_files: student.Resumes.length,
    resume_downloads: totalResumeDownloads,
    resume_points_spent: pointsSpent,
    hr_downloaders: uniqueHrCount,
    last_download: hrDownloads[0]
      ? {
          id: hrDownloads[0].id,
          points: hrDownloads[0].credits_change,
          downloaded_at: hrDownloads[0].created_at,
          by: hrDownloads[0].hrUser?.User
        }
      : null,
    download_history: hrDownloads.slice(0, 3).map((txn) => ({
      id: txn.id,
      by: txn.hrUser?.User,
      resume_id: txn.resume_id,
      points: txn.credits_change,
      created_at: txn.created_at
    }))
  };
  res.json({
    student: {
      id: student.id,
      email: student.User?.email,
      name: student.User?.name,
      phone: student.User?.phone,
      skills: student.skills,
      experience_years: student.experience_years,
      resume_file: student.resume_file,
      profile_status: student.profile_status,
      resumes: (student.Resumes || []).map((resume) => ({
        id: resume.id,
        file_path: resume.file_path,
        download_count: resume.download_count,
        created_at: resume.created_at,
        visible_to_hr: resume.visible_to_hr
      })),
      courses: studentCourses.map((entry) => ({
        id: entry.id,
        status: entry.status,
        course: entry.Course
          ? {
              id: entry.Course.id,
              name: entry.Course.name,
              level: entry.Course.level,
              description: entry.Course.description
            }
          : null
      })),
      internships: studentInternships.map((entry) => ({
        id: entry.id,
        status: entry.status,
        desired_skills: entry.desired_skills,
        purpose: entry.purpose,
        duration_months: entry.duration_months,
        start_date: entry.start_date,
        internship: (() => {
          const internship = internshipMap[entry.internship_id];
          if (!internship) return null;
          return {
            id: internship.id,
            title: internship.title,
            company: internship.company,
            location: internship.location,
            duration_months: internship.duration_months
          };
        })()
      })),
      analytics
    },
    bookings: bookings.map((booking) => ({
      id: booking.id,
      slot_time: booking.slot_time,
      status: booking.status,
      amount: booking.amount,
      interviewer: {
        id: booking.Interviewer?.id,
        name: booking.Interviewer?.User?.name,
        company: booking.Interviewer?.Company?.name,
        rate: booking.Interviewer?.rate
      },
    interview: booking.interviewDetails,
    studentFeedback: booking.interviewDetails
      ? {
          overallRating: booking.interviewDetails.student_overall_rating,
          comments: booking.interviewDetails.student_comments,
          skillRatings: booking.interviewDetails.student_skill_ratings,
          submitted: booking.interviewDetails.student_feedback_submitted,
          submittedAt: booking.interviewDetails.student_feedback_submitted_at
        }
      : null
  }))
  });
};

const uploadStudentResume = async (req, res) => {
  const { id } = req.params;
  const { file_path } = req.body;
  if (!file_path) return res.status(400).json({ message: 'file_path required' });
  const student = await Student.findByPk(id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const resume = await Resume.create({
    student_id: student.id,
    file_path,
    download_count: 0
  });
  student.resume_file = file_path;
  await student.save();
  res.status(201).json({ resume });
};
const downloadResumeForAdmin = async (req, res) => {
  const { id } = req.params;
  const resume = await Resume.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, as: 'User', attributes: ['name', 'email'] }]
      }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const rules = await fetchPointsRules();
  const cost_points = calculateResumeCost(resume, rules);
  logAudit(req, 'download_resume', {
    resumeId: resume.id,
    studentId: resume.Student?.id,
    candidate: resume.Student?.User?.name,
    email: resume.Student?.User?.email,
    download_count: resume.download_count
  });
  res.json({
    url: resume.file_path,
    candidate: resume.Student?.User?.name,
    email: resume.Student?.User?.email,
    download_count: resume.download_count,
    cost_points
  });
};

const publishResumeForAdmin = async (req, res) => {
  const { id } = req.params;
  const publish = req.body.publish !== undefined ? Boolean(req.body.publish) : true;
  const resume = await Resume.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, as: 'User', attributes: ['name', 'email'] }]
      }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  resume.visible_to_hr = publish;
  await resume.save();
  logAudit(req, 'publish_resume', {
    resumeId: resume.id,
    studentId: resume.Student?.id,
    visible_to_hr: resume.visible_to_hr
  });
  res.json({
    resume: {
      id: resume.id,
      visible_to_hr: resume.visible_to_hr
    }
  });
};

const getResumeCostForAdmin = async (req, res) => {
  const { id } = req.params;
  const resume = await Resume.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, as: 'User', attributes: ['name', 'email'] }]
      }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const rules = await fetchPointsRules();
  const cost_points = calculateResumeCost(resume, rules);
  res.json({
    id: resume.id,
    download_count: resume.download_count,
    candidate: resume.Student?.User?.name,
    cost_points
  });
};

const listPendingProfiles = async (req, res) => {
  const [students, interviewers] = await Promise.all([
    Student.findAll({
      where: { profile_status: PROFILE_STATUS.PENDING_REVIEW },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    }),
    Interviewer.findAll({
      where: { profile_status: PROFILE_STATUS.PENDING_REVIEW },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Company, attributes: ['id', 'name'] }
      ]
    })
  ]);
  res.json({ students, interviewers });
};

const verifyProfile = async (req, res) => {
  const { role, id } = req.params;
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }
  let profile;
  if (role === 'student') {
    profile = await Student.findByPk(id, { include: [{ model: User, attributes: ['name', 'email'] }] });
  } else if (role === 'interviewer') {
    profile = await Interviewer.findByPk(id, {
      include: [
        { model: User, attributes: ['name', 'email'] },
        { model: Company, attributes: ['name'] }
      ]
    });
  } else {
    return res.status(400).json({ message: 'Unsupported role' });
  }
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  profile.profile_status = status === 'approved' ? PROFILE_STATUS.APPROVED : PROFILE_STATUS.REJECTED;
  profile.profile_rejected_reason = status === 'rejected' ? notes || null : null;
  await profile.save();
  res.json({ profile });
};

const toggleProfileActive = async (req, res) => {
  const { role, id } = req.params;
  const { active, reason } = req.body;
  if (!['student', 'interviewer'].includes(role)) {
    return res.status(400).json({ message: 'Unsupported role' });
  }
  const Model = role === 'student' ? Student : Interviewer;
  const profile = await Model.findByPk(id);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  const nextActive = active === undefined ? !profile.is_active : Boolean(active);
  profile.is_active = nextActive;
  if (nextActive) {
    profile.activation_reason = reason || profile.activation_reason;
    profile.deactivation_reason = null;
  } else {
    profile.deactivation_reason = reason || profile.deactivation_reason;
    profile.activation_reason = null;
  }
  await profile.save();
  logAudit(req, 'toggle_profile_active', {
    role,
    id: profile.id,
    is_active: profile.is_active,
    reason
  });
  res.json({ profile });
};

const editInterviewFeedback = async (req, res) => {
  const { interviewId } = req.params;
  const { overall_rating, skill_ratings, skill_comments, feedback, improve_areas } = req.body;
  const interview = await Interview.findByPk(interviewId, {
    include: [{ model: Booking, include: [{ model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }] }]
  });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  const updates = {};
  if (overall_rating !== undefined) {
    interview.overall_rating = overall_rating;
    updates.overall_rating = overall_rating;
  }
  if (skill_ratings) {
    interview.skill_ratings = skill_ratings;
    updates.skill_ratings = skill_ratings;
  }
  if (skill_comments) {
    interview.skill_comments = skill_comments;
    updates.skill_comments = skill_comments;
  }
  if (feedback) {
    interview.feedback = feedback;
    updates.feedback = feedback;
  }
  if (improve_areas) {
    interview.improve_areas = improve_areas;
    updates.improve_areas = improve_areas;
  }
  await interview.save();
  logAudit(req, 'edit_interview_feedback', { interviewId, updates });
  await sendFeedbackNotification({
    bookingId: interview.booking_id,
    to: interview.Booking?.Student?.User?.email,
    userId: interview.Booking?.Student?.user_id
  });
  res.json({ interview });
};

const editStudentFeedback = async (req, res) => {
  const { studentId } = req.params;
  const { skills, endorsed_skills, ratings_avg, resume_file } = req.body;
  const student = await Student.findByPk(studentId, {
    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const updates = {};
  if (skills) {
    student.skills = skills;
    updates.skills = skills;
  }
  if (endorsed_skills) {
    student.endorsed_skills = endorsed_skills;
    updates.endorsed_skills = endorsed_skills;
  }
  if (ratings_avg !== undefined) {
    student.ratings_avg = Number(ratings_avg);
    updates.ratings_avg = Number(ratings_avg);
  }
  if (resume_file) {
    student.resume_file = resume_file;
    updates.resume_file = resume_file;
  }
  await student.save();
  logAudit(req, 'edit_student_feedback', { studentId, updates });
  res.json({ student });
};

const publishInterviewFeedback = async (req, res) => {
  const { id } = req.params;
  const interview = await Interview.findByPk(id, {
    include: [
      {
        model: Booking,
        include: [
          { model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }
        ]
      }
    ]
  });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  interview.interviewer_feedback_published = true;
  interview.interviewer_feedback_published_at = new Date();
  await interview.save();
  await sendFeedbackNotification({
    bookingId: interview.booking_id,
    to: interview.Booking?.Student?.User?.email,
    userId: interview.Booking?.Student?.user_id
  });
  logAudit(req, 'publish_interview_feedback', { interviewId: id, bookingId: interview.booking_id });
  res.json({ interview });
};

const listInterviewerFeedback = async (req, res) => {
  const { id } = req.params;
  const interviewer = await Interviewer.findByPk(id);
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  const feedback = await Interview.findAll({
    include: [
      {
        model: Booking,
        where: { interviewer_id: interviewer.id },
        include: [{ model: Student, include: [{ model: User, attributes: ['id', 'name', 'email'] }] }]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  res.json({ interviewer: interviewer.User?.name, feedback });
};

const updateInterviewerRate = async (req, res) => {
  const { id } = req.params;
  const { rate } = req.body;
  if (rate === undefined) return res.status(400).json({ message: 'Rate required' });
  const interviewer = await Interviewer.findByPk(id);
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  interviewer.rate = Number(rate);
  await interviewer.save();
  logAudit(req, 'update_interviewer_rate', { interviewerId: interviewer.id, rate: interviewer.rate });
  res.json({ interviewer });
};

const createPointsRule = async (req, res) => {
  const { skill_id, min_experience = 0, max_experience = null, cost_points } = req.body;
  if (typeof cost_points !== 'number') {
    return res.status(400).json({ message: 'cost_points required' });
  }
  const rule = await PointsRule.create({
    skill_id: skill_id || null,
    min_experience,
    max_experience,
    cost_points
  });
  res.status(201).json(rule);
};

const listPointsRules = async (req, res) => {
  const rules = await PointsRule.findAll({
    include: [{ model: Skill, as: 'Skill' }]
  });
  res.json({ rules });
};

const downloadFeedbackTemplate = async (req, res) => {
  const { interviewId } = req.params;
  const interview = await Interview.findByPk(interviewId, {
    include: [
      {
        model: Booking,
        include: [
          {
            model: Student,
            include: [{ model: User, attributes: ['name', 'email'], as: 'User' }]
          },
          {
            model: Interviewer,
            include: [{ model: User, attributes: ['name', 'email'], as: 'User' }]
          }
        ]
      }
    ]
  });
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  const booking = interview.Booking || {};
  const student = booking.Student;
  const interviewer = booking.Interviewer;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  logAudit(req, 'download_feedback_template', {
    interviewId,
    student: student?.User?.name,
    interviewer: interviewer?.User?.name,
    bookingId: booking?.id
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="feedback-${interviewId}.pdf"`);
  doc.pipe(res);
  doc.rect(0, 0, doc.page.width, 80).fill('#1f2937');
  doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text('Candidate Feedback Report', 50, 28);
  doc.fillColor('#9ca3af');
  doc.fontSize(10).text('Interview Booking Platform', 50, 52);
  doc.fillColor('#000');
  doc.moveDown(2);
  const drawField = (label, value) => {
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(11).text(`${label}: `, { continued: true });
    doc.fillColor('#111827').font('Helvetica').text(value);
  };
  drawField('Student', student?.User?.name || 'N/A');
  drawField('Email', student?.User?.email || 'N/A');
  drawField('Skills', (student?.skills || []).join(', ') || 'N/A');
  drawField('Experience', `${student?.experience_years ?? 'N/A'} years`);
  drawField('Interviewer', interviewer?.User?.name || 'N/A');
  drawField(
    'Interview date/time',
    new Date(booking?.slot_time || interview.created_at).toLocaleString()
  );
  doc.moveDown();
  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(14).text('Skill-wise breakdown');
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(11);
  const headers = ['Skill', 'Rating', 'Comments'];
  const columnWidths = [180, 60, 220];
  const tableTop = doc.y;
  const cellHeight = 20;

  const drawRow = (row, y, bold = false) => {
    let x = doc.page.margins.left;
    row.forEach((text, index) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
      doc.text(text, x + 5, y + 5, {
        width: columnWidths[index] - 10,
        align: index === 1 ? 'center' : 'left'
      });
      doc.rect(x, y, columnWidths[index], cellHeight).stroke();
      x += columnWidths[index];
    });
  };

  drawRow(headers, tableTop, true);
  const skillRatings = interview.skill_ratings || {};
  const skillCommentsSource =
    typeof interview.skill_comments === 'string'
      ? {}
      : interview.skill_comments || {};
  const allSkills = new Set(Object.keys(skillRatings));
  Object.keys(skillCommentsSource).forEach((skill) => {
    allSkills.add(skill);
  });
  const rows = Array.from(allSkills).map((skill) => ({
    skill,
    rating: skillRatings[skill]?.toString() || '—',
    comments: skillCommentsSource[skill] || ''
  }));

  let rowY = tableTop + cellHeight;
  if (rows.length) {
    rows.forEach((row) => {
      if (rowY + cellHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        rowY = doc.page.margins.top;
        drawRow(headers, rowY, true);
        rowY += cellHeight;
      }
      drawRow([row.skill, row.rating, row.comments], rowY);
      rowY += cellHeight;
    });
  } else {
    drawRow(['No skills recorded', '—', '—'], rowY);
    rowY += cellHeight;
  }

  doc.moveDown(2);
  doc.rect(doc.page.margins.left, doc.y, doc.page.width - doc.page.margins.left * 2, 60).stroke('#d1d5db');
  const summaryTop = doc.y + 4;
  doc.font('Helvetica-Bold').fontSize(12).text('Summary', doc.page.margins.left + 6, summaryTop);
  doc.font('Helvetica').fontSize(11);
  doc.text(
    `Overall rating: ${interview.overall_rating ?? 'N/A'}`,
    { continued: true }
  );
  doc.text(`    Feedback: ${interview.feedback || 'N/A'}`);
  doc.text(`Improvement areas: ${interview.improve_areas?.join(', ') || 'N/A'}`);
  doc.end();
};

module.exports = {
  createUser,
  getAnalytics,
  createCompany,
  listCompanies,
  createCourse,
  listCourses,
  toggleCoursePublish,
  getCourseAnalytics,
  exportCourseAnalytics,
  getCourseRegistrations,
  createSkill,
  listSkills,
  listPaymentAudits,
  getRoleAnalytics,
  getRoleTrend,
  exportRoleAnalytics,
  listUsers,
  listBookingsWithFeedback,
  updateInterviewer,
  updateStudentProfile,
  updateInterviewerProfile,
  createStudentProfile,
  createInterviewerProfile,
  createBookingOnBehalf,
  listInterviewers,
  exportReports,
  listPendingProfiles,
  verifyProfile,
  toggleProfileActive,
  listStudentProfiles,
  downloadResumeForAdmin,
  publishResumeForAdmin,
  getResumeCostForAdmin,
  downloadFeedbackTemplate,
  getStudentDetail,
  uploadStudentResume,
  createPointsRule,
  listPointsRules,
  listInterviewerFeedback,
  updateInterviewerRate,
  editInterviewFeedback,
  editStudentFeedback,
  publishInterviewFeedback,
  getConsultancyAnalytics,
  exportConsultancyAnalytics,
  getAdminOverview,
  addConsultancyCredits,
  updateConsultancyStatus,
  updateCompany,
  toggleCompanyPublish,
  updateSkill,
  toggleSkillPublish,
  createInternship,
  listInternships,
  getInternshipRegistrations,
  toggleInternshipPublish,
  listInternshipRegistrations,
  getInternshipAnalytics,
  exportInternshipAnalytics,
  exportFeedbackHistory,
  startInterview,
  getHrPipeline,
  moveHrPipelineStage,
  adminCompleteInterview
};
