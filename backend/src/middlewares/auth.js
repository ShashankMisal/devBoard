const jwt = require('jsonwebtoken');

const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const User = require('../modules/users/user.model');

const extractBearerToken = (authorizationHeader = '') => {
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme === 'Bearer' && token) {
    return token;
  }

  return null;
};

const verifyJWT = async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization) || req.cookies?.accessToken;

  if (!token) {
    return next(ApiError.unauthorized('Access token is required.'));
  }

  try {
    const decodedToken = jwt.verify(token, config.jwt.accessSecret);
    const user = await User.findById(decodedToken.userId);

    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('User is not authorized.'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(
      ApiError.unauthorized(
        error.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Invalid access token.'
      )
    );
  }
};

const verifyAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access is required.'));
  }

  return next();
};

module.exports = {
  verifyJWT,
  verifyAdmin
};
