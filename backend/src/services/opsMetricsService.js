const { Op } = require('sequelize');
const { Booking, Interview, Student, Interviewer, HrTransaction, ResourceAudit, Resume, User } = require('../models');

const buildOpsMetrics = async () => {
  const [bookingCount, completedBookings, paymentFailures, students, interviewers, hrDownloads, logsToday] =
    await Promise.all([
      Booking.count(),
      Booking.count({ where: { status: 'completed' } }),
      Booking.count({ where: { status: 'pending' } }),
      Student.count(),
      Interviewer.count(),
      HrTransaction.count({ where: { type: 'download' } }),
      ResourceAudit.count({ where: { created_at: { [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) } } })
    ]);

  const recentInterviews = await Interview.findAll({
    include: [{ model: Booking, include: [{ model: Student, include: [User] }, { model: Interviewer }] }],
    order: [['created_at', 'DESC']],
    limit: 5
  });

  const statusPie = {
    students,
    interviewers,
    bookingsPending: paymentFailures,
    hrDownloads
  };

  return {
    bookingCount,
    completedBookings,
    statusPie,
    hrDownloads,
    recentInterviews: recentInterviews.map((interview) => ({
      id: interview.id,
      interviewer: interview.Booking?.Interviewer?.User?.name,
      student: interview.Booking?.Student?.User?.name,
      slot: interview.Booking?.slot_time,
      rating: interview.overall_rating
    })),
    resourceAssignments: logsToday
  };
};

module.exports = { buildOpsMetrics };
