// middleware/validate.js — Generic Zod request schema validation middleware
const { ZodError } = require('zod');

/**
 * Validates req.body, req.query, or req.params against a Zod schema.
 * Returns 400 with structured validation errors on failure.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validated = schema.parse(dataToValidate);
      req[source] = validated;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      return next(err);
    }
  };
}

module.exports = validate;
