const { Interview, Booking } = require('../models');
const { Op } = require('sequelize');

const fetchLatestPublishedInterviewsByStudent = async (studentIds = []) => {
  if (!Array.isArray(studentIds) || !studentIds.length) {
    return {};
  }
  const interviews = await Interview.findAll({
    where: { interviewer_feedback_published: true },
    include: [
      {
        model: Booking,
        attributes: ['student_id'],
        where: {
          student_id: {
            [Op.in]: studentIds
          }
        }
      }
    ],
    order: [['created_at', 'DESC']]
  });
  const latestMap = {};
  interviews.forEach((interview) => {
    const studentId = interview.Booking?.student_id;
    if (!studentId || latestMap[studentId]) return;
    latestMap[studentId] = {
      id: interview.id,
      overall_rating: interview.overall_rating ?? null,
      skill_ratings: interview.skill_ratings || null,
      skill_comments: interview.skill_comments || null,
      created_at: interview.created_at,
      updated_at: interview.updated_at
    };
  });
  return latestMap;
};

module.exports = {
  fetchLatestPublishedInterviewsByStudent
};
