const nodemailer = require('nodemailer');
const { Notification, Interviewer, User } = require('../models');
const { logError } = require('./monitoringService');

const createTransporter = () => {
  const host = process.env.EMAIL_HOST;
  if (
    !host ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    host.includes('example.com')
  ) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: +process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const transporter = createTransporter();

const sendEmail = async ({ to, subject, text }) => {
  if (!to || !transporter) {
    console.info('Email not sent (missing recipient or transporter)');
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
  } catch (err) {
    logError(err, { path: 'notificationService.sendEmail', method: 'email' });
  }
};

const persistNotification = async ({ userId, type, message, meta }) => {
  if (!Notification || !userId) {
    return;
  }
  await Notification.create({ user_id: userId, type, message, meta });
};

const formatSlotTime = (slotTime) => {
  if (!slotTime) return 'a forthcoming time';
  const date = new Date(slotTime);
  if (Number.isNaN(date.getTime())) return 'a forthcoming time';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const sendBookingNotification = async ({
  bookingId,
  to,
  userId,
  slot_time,
  meeting_link,
  recipientRole = 'student'
}) => {
  if (!to) return;
  const formattedSlot = formatSlotTime(slot_time);
  const intro =
    recipientRole === 'interviewer'
      ? `A new interview session (booking ${bookingId}) has been confirmed for you on ${formattedSlot}.`
      : `Your interview booking ${bookingId} is confirmed for ${formattedSlot}.`;
  let message = `${intro} `;
  if (meeting_link) {
    message += `Join the meeting via ${meeting_link}.`;
  } else {
    message += 'The meeting link will be shared shortly.';
  }
  await sendEmail({
    to,
    subject: 'Interview booking confirmed',
    text: message
  });
  await persistNotification({
    userId,
    type: 'booking',
    message: `Booking ${bookingId} scheduled for ${formattedSlot}.`,
    meta: { bookingId, meeting_link }
  });
};

const sendFeedbackNotification = async ({ bookingId, to, userId }) => {
  await sendEmail({
    to,
    subject: 'Interview feedback delivered',
    text: `Feedback for booking ${bookingId} is available in your dashboard.`
  });
  await persistNotification({ userId, type: 'feedback', message: `Feedback available for booking ${bookingId}.`, meta: { bookingId } });
};

const sendFeedbackReportEmail = async ({ to, bookingId, buffer }) => {
  if (!to || !transporter || !buffer) {
    console.info('Feedback report email skipped (missing parameters or transporter).');
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `Interview feedback report for booking ${bookingId}`,
      text: `Attached is the detailed feedback report for your recent interview (booking ${bookingId}).`,
      attachments: [
        { filename: `feedback-${bookingId}.pdf`, content: buffer }
      ]
    });
  } catch (err) {
    logError(err, { path: 'notificationService.sendFeedbackReportEmail', method: 'email' });
  }
};

const sendWelcomeEmail = async ({ role, to, name, userId }) => {
  const subject = `Welcome to Interview Booking (${role || 'User'})`;
  const body = `Hi ${name || 'there'},\n\nWelcome to Interview Booking! Your ${role || 'account'} is ready. Log in to continue.\n\nRegards,\nInterview Booking Team`;
  await sendEmail({ to, subject, text: body });
  await persistNotification({ userId, type: 'welcome', message: `Welcome as ${role}.`, meta: { role } });
};

const sendVerificationEmail = async ({ to, code, subject, text }) => {
  await sendEmail({
    to,
    subject: subject || 'Verify your Interview Booking email',
    text: text || `Enter the following OTP to confirm your email: ${code}`
  });
};

const sendPasswordResetEmail = async ({ to, code }) => {
  await sendEmail({
    to,
    subject: 'Reset your Interview Booking password',
    text: `Use the following OTP to reset your password: ${code}`
  });
};

const adminEmail = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_ADMIN_EMAIL || null;
const sendAdminNotification = async ({ subject, text }) => {
  if (!adminEmail) return;
  await sendEmail({ to: adminEmail, subject, text });
};

const notifyBookingParticipants = async ({ booking, interviewer: providedInterviewer }) => {
  if (!booking) return;
  const student = booking.Student;
  const studentEmail = student?.User?.email;
  const studentUserId = student?.user_id;
  let interviewer =
    providedInterviewer ||
    null;
  if (!interviewer?.User) {
    interviewer = await Interviewer.findOne({
      where: { id: booking.interviewer_id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
  }
  const meeting_link = interviewer?.meeting_link;
  const interviewerEmail = interviewer?.User?.email;
  const interviewerUserId = interviewer?.user_id;

  await Promise.all([
    sendBookingNotification({
      bookingId: booking.id,
      to: studentEmail,
      userId: studentUserId,
      slot_time: booking.slot_time,
      meeting_link,
      recipientRole: 'student'
    }),
    sendBookingNotification({
      bookingId: booking.id,
      to: interviewerEmail,
      userId: interviewerUserId,
      slot_time: booking.slot_time,
      meeting_link,
      recipientRole: 'interviewer'
    })
  ]);
};

module.exports = {
  sendBookingNotification,
  sendFeedbackNotification,
  sendFeedbackReportEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  notifyBookingParticipants,
  persistNotification,
  sendEmail,
  sendAdminNotification,
  formatSlotTime
};
