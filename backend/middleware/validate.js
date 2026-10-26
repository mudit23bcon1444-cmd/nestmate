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
        const rawErrors = err.issues || err.errors || [];
        const errors = rawErrors.map(e => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
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
