const Joi = require('joi');

const questionSchema = Joi.object({
  prompt: Joi.string().trim().required(),
  hint: Joi.string().trim().allow('', null),
  description: Joi.string().trim().allow('', null)
});

const createQuizCatalogSchema = Joi.object({
  title: Joi.string().trim().required(),
  skill_id: Joi.number().integer().positive().required(),
  questions: Joi.array().items(questionSchema).default([]),
  published: Joi.boolean().default(false),
  next_publish_at: Joi.date().iso().allow(null)
});

const updateQuizCatalogSchema = Joi.object({
  title: Joi.string().trim(),
  skill_id: Joi.number().integer().positive(),
  questions: Joi.array().items(questionSchema),
  published: Joi.boolean(),
  next_publish_at: Joi.date().iso().allow(null)
});

module.exports = {
  createQuizCatalogSchema,
  updateQuizCatalogSchema
};
