const { validationError } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = {};
        result.error.errors.forEach((err) => {
          const field = err.path.join('.');
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(err.message);
        });
        return validationError(res, errors);
      }
      req.validated = result.data;
      next();
    } catch (err) {
      return validationError(res, {}, 'Validation error');
    }
  };
};

module.exports = validate;
