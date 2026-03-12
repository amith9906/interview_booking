const { Op, literal } = require('sequelize');
const {
  Interviewer,
  Booking,
  Student,
  Company,
  Interview,
  User,
  Course,
  StudentCourse,
  PaymentAudit,
  Internship,
  StudentInternship
} = require('../models');
const {
  sendBookingNotification,
  sendFeedbackReportEmail,
  sendFeedbackNotification,
  notifyBookingParticipants
} = require('../services/notificationService');
const { logAudit } = require('../services/auditLogService');
const { enrollStudentCourses } = require('../services/courseService');
const { createCheckoutSession, retrieveSession } = require('../services/stripeService');
const { createFeedbackReportBuffer } = require('../services/reportService');
const { registerStudentInternship } = require('../services/internshipService');
const { alertIfCritical } = require('../services/monitoringService');

const logPaymentStatus = async ({ sessionId, status, message }) => {
  if (!sessionId) return;
  const audit = await PaymentAudit.findOne({ where: { session_id: sessionId } });
  if (!audit) return;
  audit.status = status;
  if (message) audit.message = message;
  await audit.save();
  if (status === 'failure') {
    alertIfCritical('Payment verification failed', { sessionId, message });
  }
};

const searchInterviews = async (req, res) => {
  const { skills, exp, company } = req.query;
  const where = {};
  let skillArray = [];
  if (skills) {
    skillArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skillArray.length) {
      const escapeValue = (value) => value.replace(/'/g, "''").toLowerCase();
      const skillFilters = skillArray.map((skill) =>
        literal(
          `EXISTS (SELECT 1 FROM unnest("skill_set") AS s WHERE lower(s) LIKE '%${escapeValue(
            skill
          )}%')`
        )
      );
      where[Op.or] = skillFilters;
    }
  }
  if (exp) {
    where.experience_years = { [Op.gte]: parseInt(exp, 10) };
  }
  if (company) {
    where['$Company.name$'] = company;
  }
  const include = [
    { model: Company, attributes: ['name'], required: !!company },
    { model: User, attributes: ['name'] }
  ];
  let interviewers = await Interviewer.findAll({ where, include });

  // Filter availability slots by excluding pending/paid/completed bookings
  const interviewerIds = interviewers.map((i) => i.id);
  const existingBookings = await Booking.findAll({
    where: {
      interviewer_id: { [Op.in]: interviewerIds },
      status: { [Op.in]: ['pending', 'paid', 'completed'] }
    },
    attributes: ['interviewer_id', 'slot_time']
  });

  const bookedSlotsByInterviewer = {};
  existingBookings.forEach((b) => {
    if (!bookedSlotsByInterviewer[b.interviewer_id]) bookedSlotsByInterviewer[b.interviewer_id] = new Set();
    bookedSlotsByInterviewer[b.interviewer_id].add(new Date(b.slot_time).toISOString());
  });

  interviewers = interviewers.map((interviewer) => {
    const data = interviewer.toJSON();
    const bookedSet = bookedSlotsByInterviewer[data.id] || new Set();
    
    if (data.availability_slots) {
      data.availability_slots = data.availability_slots.map((slotObj) => {
        const slotsWithStatus = slotObj.time_slots.map((time) => {
          const slotIso = new Date(`${slotObj.date}T${time}:00`).toISOString();
          return {
            time: time,
            is_booked: bookedSet.has(slotIso)
          };
        });
        return { ...slotObj, time_slots: slotsWithStatus };
      });
    }
    
    const normalizedSkillSet = (data.skill_set || []).map((skill) => (skill || '').toLowerCase());
    const matchedSkills = Array.from(
      new Set(
        skillArray
          .map((skill) => skill.trim())
          .filter(Boolean)
          .filter((term) => normalizedSkillSet.some((stored) => stored.includes(term.toLowerCase())))
      )
    );
    data.matched_skills = matchedSkills;
    data.match_count = matchedSkills.length;

    return data;
  });

  res.json(interviewers);
};

const bookSlot = async (req, res) => {
  const { interviewer_id, slot_time, amount } = req.body;
  const student = await Student.findOne({ where: { user_id: req.user.id }, include: [User] });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const interviewer = await Interviewer.findByPk(interviewer_id);
  if (!interviewer) return res.status(404).json({ message: 'Interviewer not found' });
  const amountInt = parseInt(amount, 10);
  if (Number.isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  const minRate = interviewer.rate || 0;
  if (amountInt < minRate) {
    return res.status(400).json({ message: 'Amount cannot be lower than interviewer rate' });
  }

  const existingBooking = await Booking.findOne({
    where: {
      interviewer_id,
      slot_time: new Date(slot_time),
      status: { [Op.in]: ['pending', 'paid', 'completed'] }
    }
  });

  if (existingBooking) {
    return res.status(400).json({ message: 'This interviewer is already booked for this slot.' });
  }

  const studentDoubleBooking = await Booking.findOne({
    where: {
      student_id: student.id,
      slot_time: new Date(slot_time),
      status: { [Op.in]: ['pending', 'paid', 'completed'] }
    }
  });

  if (studentDoubleBooking) {
    return res.status(400).json({ message: 'You already have another interview scheduled at this time.' });
  }
  const booking = await Booking.create({
    student_id: student.id,
    interviewer_id,
    slot_time,
    amount: amountInt,
    status: 'pending'
  });
  const stripeAmount = amountInt * 100;
  const session = await createCheckoutSession({
    mode: 'payment',
    payment_method_types: ['card', 'upi'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: 'Interview booking' },
          unit_amount: stripeAmount
        },
        quantity: 1
      }
    ],
    metadata: { booking_id: booking.id },
    success_url: `${process.env.FRONTEND_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/booking/cancel`
  });
  booking.stripe_session_id = session.id;
  await booking.save();
  await PaymentAudit.create({
    booking_id: booking.id,
    student_id: student.id,
    amount: parseInt(amount, 10),
    currency: 'inr',
    payment_method: 'card/upi',
    session_id: session.id,
    status: 'initiated',
    message: 'Stripe checkout session created'
  });
  res.json({ sessionId: session.id, url: session.url, booking });
};

const listCourses = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const courses = await Course.findAll({
    where: { published: true },
    include: [{
      model: StudentCourse,
      as: 'StudentCourses',
      where: { student_id: student.id },
      required: false
    }]
  });
  const formatted = courses.map((course) => {
    const registration = course.StudentCourses?.[0];
    return {
      id: course.id,
      name: course.name,
      level: course.level,
      duration_weeks: course.duration_weeks,
      description: course.description,
      status: registration ? registration.status : 'available',
      enrolled_at: registration?.created_at || null,
      instructor: course.instructor_name || course.instructor_email
        ? {
            name: course.instructor_name,
            title: course.instructor_title,
            email: course.instructor_email,
            bio: course.instructor_bio
          }
        : null
    };
  });
  res.json({ courses: formatted });
};

const listInternships = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const internships = await Internship.findAll({
    where: { published: true },
    include: [
      { model: Company, as: 'Company', attributes: ['id', 'name'] },
      {
        model: StudentInternship,
        as: 'Registrations',
        where: { student_id: student.id },
        required: false,
        include: [{ model: Student, as: 'Student', include: [{ model: User, attributes: ['id', 'name', 'email'] }] }]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  const formatted = internships.map((internship) => {
    const registration = internship.Registrations?.[0];
    const isRegistered = Boolean(registration);
    return {
      id: internship.id,
      title: internship.title,
      description: internship.description,
      duration_months: internship.duration_months,
      location: internship.location,
      skills: internship.skills,
      company: internship.Company?.name,
      status: isRegistered ? registration.status : 'open',
      registration_id: registration?.id || null,
      registration: registration
        ? {
            desired_skills: registration.desired_skills,
            purpose: registration.purpose,
            start_date: registration.start_date,
            duration_months: registration.duration_months,
            status: registration.status
          }
        : null,
      duration_selected: registration?.duration_months || internship.duration_months,
      start_date: registration?.start_date || null
    };
  });
  res.json({ internships: formatted });
};

const listCompanies = async (req, res) => {
  const companies = await Company.findAll({
    where: { published: true },
    attributes: ['id', 'name']
  });
  res.json({ companies });
};

const enrollCourses = async (req, res) => {
  const { course_ids = [] } = req.body;
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  if (!course_ids.length) return res.status(400).json({ message: 'Provide course_ids' });
  await enrollStudentCourses(student.id, course_ids);
  res.json({ message: 'Courses registered' });
};

const enrollInternship = async (req, res) => {
  const { internship_id, desired_skills = [], purpose, duration_months, start_date } = req.body;
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  if (!internship_id) return res.status(400).json({ message: 'internship_id required' });
  await registerStudentInternship(student.id, internship_id, {
    desired_skills,
    purpose,
    duration_months,
    start_date
  });
  res.json({ message: 'Internship registration submitted' });
};

const listStudentBookings = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Student profile missing' });
  const bookings = await Booking.findAll({
    where: { student_id: student.id },
    include: [
      {
        model: Interviewer,
        include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: Company }]
      }
    ],
    order: [['slot_time', 'DESC']]
  });
  res.json({
    bookings: bookings.map((booking) => {
      const payload = booking.toJSON();
      return {
        id: payload.id,
        slot_time: payload.slot_time,
        status: payload.status,
        amount: payload.amount,
        interviewer: payload.Interviewer
          ? {
              id: payload.Interviewer.id,
              name: payload.Interviewer.User?.name,
              email: payload.Interviewer.User?.email,
              company: payload.Interviewer.Company?.name,
              meeting_link: payload.Interviewer.meeting_link
            }
          : null
      };
    })
  });
};

const verifySession = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
  try {
    const session = await retrieveSession(sessionId, { expand: ['payment_intent'] });
    if (!session?.metadata?.booking_id) {
      return res.status(400).json({ message: 'Booking missing' });
    }
    const booking = await Booking.findByPk(session.metadata.booking_id, {
      include: [{ model: Student, include: [User] }]
    });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.status = 'paid';
    booking.stripe_session_id = session.id;
    await booking.save();
    await notifyBookingParticipants({ booking });
    await logPaymentStatus({ sessionId, status: 'success', message: 'Payment session verified' });
    res.json({ booking });
  } catch (err) {
    await logPaymentStatus({ sessionId, status: 'failure', message: err.message });
    res.status(400).json({ message: err.message });
  }
};

const feedbackDashboard = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id }, include: [User] });
  if (!student) return res.status(404).json({ message: 'Profile not found' });
  const interviews = await Interview.findAll({
    include: [{
      model: Booking,
      where: { student_id: student.id },
      include: [
        {
          model: Interviewer,
          include: [
            { model: User, attributes: ['id', 'name', 'email'] },
            { model: Company, attributes: ['id', 'name'] }
          ]
        },
        { model: Student, include: [User] }
      ]
    }],
    order: [['created_at', 'DESC']]
  });
  res.json({ student, interviews });
};

const fetchBookingForStudent = async (bookingId, studentUserId) => {
  const booking = await Booking.findOne({
    where: { id: bookingId },
    include: [
      { model: Student, include: [User] },
      {
        model: Interviewer,
        include: [
          { model: User, attributes: ['id', 'name', 'email'] },
          { model: Company, attributes: ['id', 'name'] }
        ]
      }
    ]
  });
  if (!booking) return null;
  if (booking.Student?.user_id !== studentUserId) return null;
  return booking;
};

const downloadFeedbackReport = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await fetchBookingForStudent(bookingId, req.user.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found or access denied' });
  const interview = await Interview.findOne({ where: { booking_id: booking.id } });
  if (!interview) return res.status(404).json({ message: 'Interview feedback not available yet' });
  const buffer = await createFeedbackReportBuffer({ booking, interview });
  if (req.query.email === 'true' && booking.Student?.User?.email) {
    await sendFeedbackReportEmail({
      to: booking.Student.User.email,
      bookingId: booking.id,
      buffer
    });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="feedback-${booking.id}.pdf"`);
  res.send(buffer);
};

const submitStudentFeedback = async (req, res) => {
  const { bookingId } = req.params;
  const { skill_ratings = {}, comments, overall_rating } = req.body;
  const booking = await fetchBookingForStudent(bookingId, req.user.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found or access denied' });
  let interview = await Interview.findOne({ where: { booking_id: booking.id } });
  if (!interview) return res.status(404).json({ message: 'Interview feedback not available yet' });
  if (!interview.interviewer_feedback_published) {
    return res.status(400).json({ message: 'Interviewer feedback not yet published' });
  }
  if (interview.student_feedback_submitted) {
    return res.status(400).json({ message: 'Student feedback already submitted' });
  }
  interview.student_skill_ratings = skill_ratings;
  interview.student_comments = comments || '';
  interview.student_overall_rating = overall_rating !== undefined ? Number(overall_rating) : null;
  interview.student_feedback_submitted = true;
  interview.student_feedback_submitted_at = new Date();
  await interview.save();
  await sendFeedbackNotification({
    bookingId: booking.id,
    to: booking.Interviewer?.User?.email,
    userId: booking.Interviewer?.user_id
  });
  logAudit(req, 'submit_student_feedback', {
    bookingId: booking.id,
    interviewId: interview.id,
    studentId: booking.Student?.id
  });
  res.json({ message: 'Student feedback submitted' });
};

const emailFeedbackReport = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await fetchBookingForStudent(bookingId, req.user.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found or access denied' });
  const interview = await Interview.findOne({ where: { booking_id: booking.id } });
  if (!interview) return res.status(404).json({ message: 'Interview feedback not available yet' });
  if (!booking.Student?.User?.email) {
    return res.status(400).json({ message: 'Student email missing' });
  }
  const buffer = await createFeedbackReportBuffer({ booking, interview });
  await sendFeedbackReportEmail({
    to: booking.Student.User.email,
    bookingId: booking.id,
    buffer
  });
  res.json({ message: 'Feedback report sent via email' });
};

const getStudentAnalytics = async (req, res) => {
  const student = await Student.findOne({ where: { user_id: req.user.id } });
  if (!student) return res.status(404).json({ message: 'Profile not found' });
  const bookings = await Booking.findAll({ where: { student_id: student.id } });
  const interviews = await Interview.findAll({ include: [{ model: Booking, where: { student_id: student.id } }] });
  
  const totalBookings = bookings.length;
  const paidBookings = bookings.filter((b) => b.status === 'paid' || b.status === 'completed').length;
  const avgRating =
    interviews.length > 0 ? interviews.reduce((sum, interview) => sum + (interview.overall_rating || 0), 0) / interviews.length : 0;
  
  const skills = student.skills || [];
  const endorsedSkills = student.endorsed_skills || [];
  
  // Calculate ATS Score: Base 40 + (skills * 2) + (endorsed * 5) + (exp * 5). Cap at 100.
  let atsScore = 40 + (skills.length * 2) + (endorsedSkills.length * 5) + ((student.experience_years || 0) * 5);
  atsScore = Math.min(100, atsScore);

  // Matchmaking / Recommendations
  // Standard list of highly demanded skills
  const demandSkills = ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'SQL', 'TypeScript'];
  const lowercaseSkills = skills.map(s => s.toLowerCase());
  const missingSkills = demandSkills.filter(ds => !lowercaseSkills.includes(ds.toLowerCase()));

  // Find courses that teach the missing skills
  let recommendedCourses = [];
  if (missingSkills.length > 0) {
    recommendedCourses = await Course.findAll({
      where: {
        description: {
          [Op.or]: missingSkills.map(ms => ({ [Op.iLike]: `%${ms}%` }))
        }
      },
      limit: 3
    });
    // If no specific keyword matches, just suggest general top courses
    if (recommendedCourses.length === 0) {
      recommendedCourses = await Course.findAll({ limit: 3 });
    }
  }

  res.json({
    totalBookings,
    paidBookings,
    avgRating: Number(avgRating.toFixed(2)),
    topSkills: skills.slice(0, 5),
    endorsedSkills,
    atsScore,
    missingSkills,
    recommendedCourses: recommendedCourses.map(c => ({ id: c.id, name: c.name }))
  });
};

const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await fetchBookingForStudent(bookingId, req.user.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found or access denied' });
  
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return res.status(400).json({ message: 'Cannot cancel a completed or already cancelled booking' });
  }

  // Check if booking is more than 24 hours away for refund policy (Optional/DEF-018)
  const hoursUntil = (new Date(booking.slot_time) - new Date()) / (1000 * 60 * 60);
  if (hoursUntil < 24 && booking.status === 'paid') {
      // Just a warning for now, or policy enforcement
  }

  booking.status = 'cancelled';
  await booking.save();
  
  logAudit(req, 'cancel_booking', { bookingId: booking.id, studentId: booking.student_id });
  
  // Notify interviewer
  const interviewer = await Interviewer.findByPk(booking.interviewer_id, {
      include: [{ model: User, attributes: ['id', 'email', 'name'] }]
  });
  if (interviewer?.User?.email) {
      await sendEmail({
          to: interviewer.User.email,
          subject: 'Interview Cancelled',
          text: `The interview booking #${booking.id} scheduled for ${new Date(booking.slot_time).toLocaleString()} has been cancelled by the student.`
      });
  }

  res.json({ message: 'Booking cancelled successfully', booking });
};

module.exports = {
  searchInterviews,
  bookSlot,
  feedbackDashboard,
  listCourses,
  listCompanies,
  listInternships,
  enrollCourses,
  enrollInternship,
  verifySession,
  getStudentAnalytics,
  downloadFeedbackReport,
  emailFeedbackReport,
  submitStudentFeedback,
  listStudentBookings,
  cancelBooking
};
