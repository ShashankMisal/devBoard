class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [errors];
    this.isOperational = isOperational;

    // Capturing the stack from the current constructor makes debugging cleaner by skipping framework noise.
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request.', errors = []) {
    return new ApiError(400, message, errors, true);
  }

  static unauthorized(message = 'Unauthorized.', errors = []) {
    return new ApiError(401, message, errors, true);
  }

  static forbidden(message = 'Forbidden.', errors = []) {
    return new ApiError(403, message, errors, true);
  }

  static notFound(message = 'Resource not found.', errors = []) {
    return new ApiError(404, message, errors, true);
  }

  static internal(message = 'Internal server error.', errors = []) {
    return new ApiError(500, message, errors, false);
  }
}

module.exports = ApiError;
