const { Student, Interviewer, HrUser, Company } = require('../models');

const fetchProfileForUser = async (user) => {
  if (!user) return null;
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { user_id: user.id } });
    return student ? student.get({ plain: true }) : null;
  }
  if (user.role === 'interviewer') {
    const interviewer = await Interviewer.findOne({
      where: { user_id: user.id },
      include: [{ model: Company, attributes: ['id', 'name'] }]
    });
    if (!interviewer) return null;
    const payload = interviewer.get({ plain: true });
    if (interviewer.Company) {
      payload.company = interviewer.Company.get({ plain: true });
    }
    return payload;
  }
  if (user.role === 'hr') {
    const hrProfile = await HrUser.findOne({ where: { user_id: user.id } });
    return hrProfile ? hrProfile.get({ plain: true }) : null;
  }
  return null;
};

module.exports = { fetchProfileForUser };
