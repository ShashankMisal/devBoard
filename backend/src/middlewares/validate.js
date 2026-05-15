const { validationResult } = require('express-validator');

const ApiError = require('../utils/ApiError');

const validate = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (validationErrors.isEmpty()) {
    return next();
  }

  const formattedErrors = validationErrors.array().map((error) => ({
    field: error.path,
    message: error.msg
  }));

  return next(ApiError.badRequest('Validation failed.', formattedErrors));
};

module.exports = validate;
