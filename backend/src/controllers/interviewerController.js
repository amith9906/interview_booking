const { Booking, Interview, Student, Interviewer, User, Resume } = require('../models');
const {
  sendBookingNotification,
  sendFeedbackNotification,
  sendAdminNotification,
  formatSlotTime
} = require('../services/notificationService');
const { logAudit } = require('../services/auditLogService');

const toPlainObject = (entity) => (entity && entity.toJSON ? entity.toJSON() : entity);

const normalizeStudent = (student) => {
  if (!student) return null;
  const normalized = toPlainObject(student);
  const { Resumes = [], ...rest } = normalized;
  const user = rest.User;
  return {
    ...rest,
    name: rest.name || user?.name,
    email: user?.email,
    resumes: Resumes.map((resume) => ({
      id: resume.id,
      file_path: resume.file_path,
      download_count: resume.download_count
    }))
  };
};

const normalizeBooking = (booking) => {
  const payload = toPlainObject(booking);
  return {
    ...payload,
    student: normalizeStudent(payload.Student)
  };
};

const getBookings = async (req, res) => {
  const interviewer = await Interviewer.findOne({
    where: { user_id: req.user.id },
    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
  });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const bookings = await Booking.findAll({
    where: { interviewer_id: interviewer.id },
    include: [
      {
        model: Student,
        include: [
          { model: User },
          { model: Resume, as: 'Resumes' }
        ]
      }
    ],
    order: [['slot_time', 'ASC']]
  });
  res.json(bookings.map(normalizeBooking));
};

const startInterview = async (req, res) => {
  const { id } = req.params;
  const interviewer = await Interviewer.findOne({
    where: { user_id: req.user.id },
    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
  });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const booking = await Booking.findOne({
    where: { id, interviewer_id: interviewer.id }
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({ message: 'Only pending bookings can be started' });
  }
  booking.status = 'in_progress';
  await booking.save();
  res.json({ booking });
};

const acknowledgeBooking = async (req, res) => {
  const { id: bookingId } = req.params;
  const interviewer = await Interviewer.findOne({ where: { user_id: req.user.id } });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const booking = await Booking.findOne({
    where: { id: bookingId, interviewer_id: interviewer.id },
    include: [{ model: Student, include: [User] }]
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.acknowledged = true;
  booking.acknowledged_at = new Date();
  booking.status = 'confirmed';
  await booking.save();
  logAudit(req, 'acknowledge_booking', { bookingId, interviewerId: interviewer.id });
  await sendBookingNotification({
    bookingId: booking.id,
    to: booking.Student?.User?.email,
    userId: booking.Student?.user_id,
    slot_time: booking.slot_time,
    meeting_link: interviewer.meeting_link,
    recipientRole: 'student'
  });
  await sendAdminNotification({
    subject: `Booking ${booking.id} accepted by interviewer`,
    text: `Interviewer ${
      interviewer.User?.name || 'Interviewer'
    } confirmed booking ${booking.id} for ${formatSlotTime(booking.slot_time)}.`
  });
  res.json({ booking });
};

const rejectBooking = async (req, res) => {
  const { id: bookingId } = req.params;
  const { reason } = req.body;
  const interviewer = await Interviewer.findOne({ where: { user_id: req.user.id } });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const booking = await Booking.findOne({
    where: { id: bookingId, interviewer_id: interviewer.id },
    include: [{ model: Student, include: [User] }]
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  booking.status = 'cancelled'; // Or 'rejected'
  booking.notes = reason ? `Rejected by interviewer: ${reason}` : 'Rejected by interviewer';
  await booking.save();
  
  logAudit(req, 'reject_booking', { bookingId, interviewerId: interviewer.id, reason });
  
  if (booking.Student?.User?.email) {
      await sendEmail({
          to: booking.Student.User.email,
          subject: 'Interview Slot Rejected',
          text: `Unfortunately, the interviewer has rejected the booking #${booking.id}. Any paid fees will be refunded. Reason: ${reason || 'N/A'}`
      });
  }
  
  res.json({ message: 'Booking rejected', booking });
};

const rescheduleBooking = async (req, res) => {
  const { id: bookingId } = req.params;
  const { slot_time } = req.body;
  if (!slot_time) return res.status(400).json({ message: 'slot_time required' });
  const interviewer = await Interviewer.findOne({ where: { user_id: req.user.id } });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const booking = await Booking.findOne({
    where: { id: bookingId, interviewer_id: interviewer.id },
    include: [{ model: Student, include: [User] }]
  });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const newSlot = new Date(slot_time);
  if (Number.isNaN(newSlot.getTime())) {
    return res.status(400).json({ message: 'Invalid slot_time' });
  }
  booking.slot_time = newSlot;
  booking.status = 'postponed';
  booking.acknowledged = false;
  booking.acknowledged_at = null;
  await booking.save();
  logAudit(req, 'reschedule_booking', { bookingId, slot_time: newSlot.toISOString() });
  await sendBookingNotification({
    bookingId: booking.id,
    to: booking.Student?.User?.email,
    userId: booking.Student?.user_id,
    slot_time: booking.slot_time,
    meeting_link: interviewer.meeting_link,
    recipientRole: 'student'
  });
  await sendAdminNotification({
    subject: `Booking ${booking.id} rescheduled by interviewer`,
    text: `Interviewer ${
      interviewer.User?.name || 'Interviewer'
    } rescheduled booking ${booking.id} to ${formatSlotTime(booking.slot_time)}.`
  });
  res.json({ booking });
};

const downloadResumeForInterviewer = async (req, res) => {
  const { id } = req.params;
  const interviewer = await Interviewer.findOne({ where: { user_id: req.user.id } });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const resume = await Resume.findByPk(id, {
    include: [
      {
        model: Student,
        as: 'Student',
        include: [{ model: User, as: 'User' }]
      }
    ]
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const booking = await Booking.findOne({
    where: {
      interviewer_id: interviewer.id,
      student_id: resume.student_id
    }
  });
  if (!booking) return res.status(403).json({ message: 'Access to this resume is restricted' });
  res.json({
    url: resume.file_path,
    candidate: resume.Student?.User?.name,
    email: resume.Student?.User?.email,
    download_count: resume.download_count
  });
};

const rateInterview = async (req, res) => {
  const {
    booking_id,
    skill_ratings = {},
    skill_comments = {},
    overall_rating,
    feedback,
    improve_areas = []
  } = req.body;
  const booking = await Booking.findByPk(booking_id, {
    include: [{
      model: Student,
      include: [User]
    }]
  });
  // Enforce timing (DEF-022)
  if (new Date(booking.slot_time) > new Date()) {
    return res.status(403).json({ message: 'Cannot submit feedback before the interview time has passed.' });
  }

  // Enforce character limit (DEF-024)
  if (feedback && feedback.length > 1000) {
    return res.status(400).json({ message: 'Feedback exceeds 1000 character limit.' });
  }

  // Enforce mandatory skill ratings (DEF-023)
  // Assuming we check against the student's skills or a required set
  // This is a simplified check
  if (!overall_rating || Object.keys(skill_ratings).length === 0) {
      return res.status(400).json({ message: 'Overall rating and skill ratings are mandatory.' });
  }

  let interview = await Interview.findOne({ where: { booking_id } });
  if (interview && interview.interviewer_feedback_published) {
    return res
      .status(403)
      .json({ message: 'Feedback already published. Contact HR/Admin to update.' });
  }

  const [savedInterview] = await Interview.upsert({
    booking_id,
    skill_ratings,
    skill_comments,
    overall_rating,
    feedback,
    improve_areas,
    interviewer_feedback_published: false, // Set to false for HR review (DEF-025, DEF-032)
    interviewer_feedback_published_at: null,
    student_feedback_submitted: false,
    student_feedback_submitted_at: null
  }, { returning: true });
  interview = savedInterview;

  booking.status = 'completed';
  await booking.save();

  // Award Endorsed Skills based on high ratings
  if (booking.Student) {
    let newEndorsed = new Set(booking.Student.endorsed_skills || []);
    
    // Check if overall is good
    if (overall_rating >= 4.0 && skill_ratings) {
      // Loop through individual skill ratings
      for (const [skill, rating] of Object.entries(skill_ratings)) {
        if (Number(rating) >= 4.0) {
          newEndorsed.add(skill);
        }
      }
    }
    
    booking.Student.endorsed_skills = Array.from(newEndorsed);
    await booking.Student.save();
  }

  // We remove the auto-increment of ratings here as it should happen after HR approval
  /*
  const interviewerEntity = await Interviewer.findByPk(booking.interviewer_id);
  if (interviewerEntity && created) {
    const prevCount = interviewerEntity.rating_count || 0;
    const prevTotal = (interviewerEntity.average_rating || 0) * prevCount;
    const newCount = prevCount + 1;
    interviewerEntity.average_rating = newCount ? (prevTotal + Number(overall_rating || 0)) / newCount : 0;
    interviewerEntity.rating_count = newCount;
    await interviewerEntity.save();
  }
  */

  logAudit(req, 'submit_interview_feedback_for_review', {
    bookingId: booking.id,
    interviewerId: booking.interviewer_id
  });
  res.json({ message: 'Feedback submitted for HR review', interview });
};

const getInterviewerAnalytics = async (req, res) => {
  const interviewer = await Interviewer.findOne({ where: { user_id: req.user.id }, include: [User] });
  if (!interviewer) return res.status(404).json({ message: 'Interviewer profile missing' });
  const bookings = await Booking.findAll({
    where: { interviewer_id: interviewer.id }
  });
  const interviews = await Interview.findAll({
    include: [{ model: Booking, where: { interviewer_id: interviewer.id } }]
  });
  const upcoming = bookings.filter((b) => b.status === 'pending' || b.status === 'paid').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const avgRating =
    interviews.length > 0 ? interviews.reduce((sum, row) => sum + (row.overall_rating || 0), 0) / interviews.length : 0;
  res.json({
    upcoming,
    completed,
    avgRating: Number(avgRating.toFixed(2)),
    totalBookings: bookings.length,
    name: interviewer.User?.name
  });
};




module.exports = {
  getBookings,
  rateInterview,
  getInterviewerAnalytics,
  startInterview,
  acknowledgeBooking,
  rescheduleBooking,
  rejectBooking,
  downloadResumeForInterviewer
};
