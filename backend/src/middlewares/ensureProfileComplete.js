const { Student, Interviewer } = require('../models');
const { PROFILE_STATUS } = require('../utils/profileStatus');

const studentAllowed = new Set([
  PROFILE_STATUS.DRAFT,
  PROFILE_STATUS.PENDING_REVIEW,
  PROFILE_STATUS.APPROVED
]);
const interviewerAllowed = new Set([PROFILE_STATUS.PENDING_REVIEW, PROFILE_STATUS.APPROVED]);

const ensureProfileComplete = () => async (req, res, next) => {
  const { role, id: userId } = req.user || {};
  if (!['student', 'interviewer'].includes(role)) {
    return next();
  }

  try {
    const Model = role === 'student' ? Student : Interviewer;
    const profile = await Model.findOne({ where: { user_id: userId } });
    if (!profile) {
      return res.status(403).json({ message: 'Complete your profile before proceeding.' });
    }
    if (typeof profile.is_active !== 'undefined' && !profile.is_active) {
      return res.status(403).json({ message: 'Your profile has been paused by admin.' });
    }
    const allowedStatuses = role === 'student' ? studentAllowed : interviewerAllowed;
    if (!allowedStatuses.has(profile.profile_status)) {
      return res
        .status(403)
        .json({ message: 'Please finish and submit your profile for admin review before accessing this feature.' });
    }
    req.profile = profile;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = ensureProfileComplete;
