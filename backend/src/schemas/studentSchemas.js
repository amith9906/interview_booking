const Joi = require('joi');

const bookSlotSchema = Joi.object({
  interviewer_id: Joi.number().integer().positive().required(),
  slot_time: Joi.date().iso().required(),
  amount: Joi.number().integer().positive().required()
});

const enrollCoursesSchema = Joi.object({
  course_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

const enrollInternshipSchema = Joi.object({
  internship_id: Joi.number().integer().positive().required(),
  desired_skills: Joi.array().items(Joi.string().trim()).optional(),
  purpose: Joi.string().trim().allow('', null),
  duration_months: Joi.number().integer().min(1).optional(),
  start_date: Joi.date().iso().optional()
});

const verifySessionSchema = Joi.object({
  sessionId: Joi.string().required()
});

const submitInterviewFeedbackSchema = Joi.object({
  skill_ratings: Joi.object()
    .pattern(Joi.string().trim(), Joi.number().min(0).max(5))
    .optional(),
  comments: Joi.string().trim().allow('', null),
  overall_rating: Joi.number().min(0).max(5).required()
});

module.exports = {
  bookSlotSchema,
  enrollCoursesSchema,
  enrollInternshipSchema,
  verifySessionSchema
  ,
  submitInterviewFeedbackSchema
};
