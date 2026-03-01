const { PointsRule, Skill } = require('../models');

const calculateResumeCost = (resume, rules = []) => {
  const baseCost = 10;
  const student = resume?.Student;
  if (!student) return baseCost;
  const experience = student.experience_years || 0;
  const skillSet = student.skills || [];
  const applicable = rules.filter((rule) => {
    if (rule.min_experience && experience < rule.min_experience) return false;
    if (rule.max_experience !== null && rule.max_experience !== undefined && experience > rule.max_experience)
      return false;
    if (rule.skill_id) {
      const skillName = rule.Skill?.name;
      if (skillName && !skillSet.includes(skillName)) return false;
    }
    return true;
  });
  if (!applicable.length) return baseCost;
  return Math.max(...applicable.map((rule) => rule.cost_points));
};

const fetchPointsRules = () =>
  PointsRule.findAll({ include: [{ model: Skill, as: 'Skill' }] });

module.exports = { calculateResumeCost, fetchPointsRules };
