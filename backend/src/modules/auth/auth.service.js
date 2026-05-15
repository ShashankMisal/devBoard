const jwt = require('jsonwebtoken');

const config = require('../../config/config');
const ApiError = require('../../utils/ApiError');
const User = require('../users/user.model');

const sanitizeUser = (userDocument) => {
  return userDocument.toJSON();
};

const issueTokensForUser = (userDocument) => {
  const accessToken = userDocument.generateAccessToken();
  const refreshToken = userDocument.generateRefreshToken();

  return {
    accessToken,
    refreshToken
  };
};

const registerUser = async (userData) => {
  const normalizedEmail = userData.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw ApiError.badRequest('An account with this email already exists.');
  }

  const user = await User.create({
    name: userData.name.trim(),
    email: normalizedEmail,
    password: userData.password
  });

  const tokens = issueTokensForUser(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    ...tokens
  };
};

const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail })
    .select('+password +refreshToken');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('This account is inactive.');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const tokens = issueTokensForUser(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    ...tokens
  };
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null
  });
};

const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is required.');
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(incomingRefreshToken, config.jwt.refreshSecret);
  } catch (error) {
    throw ApiError.unauthorized(error.name === 'TokenExpiredError'
      ? 'Refresh token has expired.'
      : 'Invalid refresh token.');
  }

  const user = await User.findById(decodedToken.userId).select('+refreshToken');

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User is not authorized to refresh tokens.');
  }

  if (!user.refreshToken || user.refreshToken !== incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token does not match the active session.');
  }

  return {
    accessToken: user.generateAccessToken()
  };
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
};
