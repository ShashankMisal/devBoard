const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');

const formatMongooseValidationError = (error) => {
  const errors = Object.values(error.errors || {}).map((validationError) => ({
    field: validationError.path,
    message: validationError.message
  }));

  return ApiError.badRequest('Validation failed.', errors);
};

const formatDuplicateKeyError = (error) => {
  const duplicatedFields = Object.keys(error.keyValue || {});
  const errors = duplicatedFields.map((field) => ({
    field,
    message: `${field} already exists.`
  }));

  return ApiError.badRequest('Duplicate field value entered.', errors);
};

const formatCastError = (error) => {
  return ApiError.badRequest(`Invalid value provided for "${error.path}".`, [
    {
      field: error.path,
      message: error.message
    }
  ]);
};

const formatJwtError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token has expired.');
  }

  return ApiError.unauthorized('Invalid authentication token.');
};

const normalizeError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error.name === 'ValidationError') {
    return formatMongooseValidationError(error);
  }

  if (error.code === 11000) {
    return formatDuplicateKeyError(error);
  }

  if (error.name === 'CastError') {
    return formatCastError(error);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return formatJwtError(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return ApiError.badRequest('Malformed JSON payload.');
  }

  return ApiError.internal('Something went wrong.');
};

const errorHandler = (error, req, res, _next) => {
  const normalizedError = normalizeError(error);
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error('Unhandled error reached the global error handler.', {
    method: req.method,
    path: req.originalUrl,
    statusCode: normalizedError.statusCode,
    isOperational: normalizedError.isOperational,
    originalErrorName: error.name,
    originalErrorMessage: error.message,
    stack: error.stack,
    errors: normalizedError.errors
  });

  const responsePayload = {
    success: false,
    message: normalizedError.message,
    errors: normalizedError.errors
  };

  if (!normalizedError.isOperational && isProduction) {
    responsePayload.message = 'Internal server error.';
    responsePayload.errors = [];
  }

  if (!isProduction) {
    responsePayload.stack = error.stack;
  }

  res.status(normalizedError.statusCode).json(responsePayload);
};

module.exports = errorHandler;
