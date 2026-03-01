const { Internship, StudentInternship } = require('../models');

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills.filter(Boolean);
  if (typeof skills === 'string') {
    return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
};

const registerStudentInternship = async (studentId, internshipId, payload = {}) => {
  const internship = await Internship.findByPk(internshipId);
  if (!internship || !internship.published) {
    throw new Error('Internship not available');
  }

  const { desired_skills = [], purpose, duration_months, start_date } = payload;
  const [registration, created] = await StudentInternship.findOrCreate({
    where: { student_id: studentId, internship_id: internshipId },
    defaults: {
      desired_skills: normalizeSkills(desired_skills),
      purpose,
      duration_months,
      start_date
    }
  });
  if (!created) {
    registration.desired_skills = normalizeSkills(desired_skills);
    registration.purpose = purpose || registration.purpose;
    registration.duration_months = duration_months || registration.duration_months;
    registration.start_date = start_date || registration.start_date;
    await registration.save();
  }
  return registration;
};

module.exports = { registerStudentInternship };
