const rateLimit = require('express-rate-limit');

const config = require('../config/config');

const buildLimiter = (maxRequests, message) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
        errors: [
          {
            field: 'rateLimit',
            message
          }
        ]
      });
    }
  });
};

const generalLimiter = buildLimiter(
  config.rateLimit.generalMax,
  'Too many requests from this IP. Please try again later.'
);

const authLimiter = buildLimiter(
  config.rateLimit.authMax,
  'Too many authentication attempts from this IP. Please try again later.'
);

module.exports = {
  generalLimiter,
  authLimiter
};
