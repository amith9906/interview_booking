const Joi = require('joi');

const roles = ['student', 'interviewer', 'hr', 'admin'];

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string()
    .valid(...roles)
    .required(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow('', null),
  profile: Joi.object().optional()
});

const createCompanySchema = Joi.object({
  name: Joi.string().trim().required(),
  published: Joi.boolean().default(false),
  offers_internships: Joi.boolean().default(false)
});

const updateCompanySchema = Joi.object({
  name: Joi.string().trim(),
  published: Joi.boolean(),
  offers_internships: Joi.boolean()
});

const createCourseSchema = Joi.object({
  name: Joi.string().trim().required(),
  level: Joi.string().trim().allow('', null),
  duration_weeks: Joi.number().integer().min(1).optional(),
  description: Joi.string().allow('', null),
  published: Joi.boolean().default(true),
  instructor_name: Joi.string().trim().allow('', null),
  instructor_title: Joi.string().trim().allow('', null),
  instructor_email: Joi.string().email().allow('', null),
  instructor_bio: Joi.string().allow('', null)
});

const createInternshipSchema = Joi.object({
  title: Joi.string().trim().required(),
  company_id: Joi.number().integer().positive().required(),
  description: Joi.string().allow('', null),
  duration_months: Joi.number().integer().min(1).optional(),
  location: Joi.string().trim().allow('', null),
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim()),
    Joi.string().trim()
  ).default([]),
  published: Joi.boolean().default(false)
});

const createSkillSchema = Joi.object({
  name: Joi.string().trim().required(),
  published: Joi.boolean().default(true)
});

const updateSkillSchema = Joi.object({
  name: Joi.string().trim(),
  published: Joi.boolean()
});

const addConsultancyCreditsSchema = Joi.object({
  points: Joi.number().integer().positive().required(),
  note: Joi.string().trim().allow('', null)
});

const createResourceSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  link: Joi.string().uri().allow('', null),
  file_url: Joi.string().uri().allow('', null),
  resource_type: Joi.string()
    .valid('pdf', 'ppt', 'link', 'video', 'other')
    .default('other'),
  visible_to_hr: Joi.boolean().default(false),
  student_ids: Joi.array().items(Joi.number().integer().positive()).optional()
});

const assignResourceSchema = Joi.object({
  student_ids: Joi.array().items(Joi.number().integer().positive()).required()
});

const createStudentProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow('', null),
  skills: Joi.array().items(Joi.string().trim()).optional(),
  endorsed_skills: Joi.array().items(Joi.string().trim()).optional(),
  experience_years: Joi.number().integer().min(0).optional(),
  education: Joi.array().items(Joi.object()).optional(),
  projects: Joi.array().items(Joi.object()).optional(),
  hobbies: Joi.array().items(Joi.string().trim()).optional(),
  resume_file: Joi.string().allow('', null),
  location: Joi.string().trim().allow('', null)
});

const createInterviewerProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow('', null),
  company_id: Joi.number().integer().positive().required(),
  title: Joi.string().trim().allow('', null),
  skill_set: Joi.array().items(Joi.string().trim()).optional(),
  availability_slots: Joi.array().items(Joi.object()).optional(),
  experience_years: Joi.number().integer().min(0).optional(),
  bio: Joi.string().allow('', null),
  rate: Joi.number().integer().min(0).optional(),
  projects: Joi.array().items(Joi.object()).optional(),
  hobbies: Joi.array().items(Joi.string().trim()).optional(),
  meeting_link: Joi.string().uri().allow('', null).optional()
});

const updateStudentProfileSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim().allow('', null),
  skills: Joi.array().items(Joi.string().trim()),
  endorsed_skills: Joi.array().items(Joi.string().trim()),
  experience_years: Joi.number().integer().min(0),
  education: Joi.array().items(Joi.object()),
  projects: Joi.array().items(Joi.object()),
  hobbies: Joi.array().items(Joi.string().trim()),
  meeting_link: Joi.string().uri().allow('', null),
  resume_file: Joi.string().allow('', null),
  location: Joi.string().trim().allow('', null),
  email: Joi.string().email()
});

const updateInterviewerProfileSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim().allow('', null),
  company_id: Joi.number().integer().positive(),
  title: Joi.string().trim().allow('', null),
  skill_set: Joi.array().items(Joi.string().trim()),
  availability_slots: Joi.array().items(Joi.object()),
  experience_years: Joi.number().integer().min(0),
  bio: Joi.string().allow('', null),
  rate: Joi.number().integer().min(0),
  projects: Joi.array().items(Joi.object()),
  hobbies: Joi.array().items(Joi.string().trim()),
  meeting_link: Joi.string().uri().allow('', null),
  email: Joi.string().email()
});

module.exports = {
  createUserSchema,
  createCompanySchema,
  updateCompanySchema,
  createCourseSchema,
  createInternshipSchema,
  createSkillSchema,
  updateSkillSchema,
  addConsultancyCreditsSchema,
  createResourceSchema,
  assignResourceSchema,
  createStudentProfileSchema,
  createInterviewerProfileSchema,
  updateStudentProfileSchema,
  updateInterviewerProfileSchema
};
