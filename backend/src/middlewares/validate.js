const { ValidationError } = require('joi');

const createValidationMiddleware = (schemaGetter, target = 'body') => (req, res, next) => {
  const source = target === 'body' ? req.body : req.query;
  const schema = schemaGetter(req);
  if (!schema) {
    return next();
  }
  const { error, value } = schema.validate(source, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((detail) => detail.message).join('; ');
    const validationError = new ValidationError(message, error.details, schema);
    validationError.status = 400;
    return next(validationError);
  }
  if (target === 'body') {
    req.body = value;
  } else {
    req.query = value;
  }
  return next();
};

const validateBody = (schema) => createValidationMiddleware(() => schema, 'body');
const validateQuery = (schemaGetter) => createValidationMiddleware(schemaGetter, 'query');

module.exports = { validateBody, validateQuery };
