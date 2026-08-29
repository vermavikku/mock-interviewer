// Validation middleware
const { ApiError } = require('../utils/apiError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source]);

    if (error) {
      return next(new ApiError(400, error.details[0].message));
    }

    next();
  };
};

module.exports = validate;
