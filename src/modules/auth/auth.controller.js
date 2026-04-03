const config = require('../../config/config');
const ApiResponse = require('../../utils/ApiResponse');
const authService = require('./auth.service');

const buildRefreshCookieOptions = () => {
  return {
    httpOnly: true,
    secure: config.app.env === 'production',
    sameSite: 'lax',
    maxAge: config.jwt.refreshCookieMaxAgeMs,
    path: '/api/v1/auth'
  };
};

const register = async (req, res) => {
  const authPayload = await authService.registerUser(req.body);

  res
    .cookie('refreshToken', authPayload.refreshToken, buildRefreshCookieOptions())
    .status(201)
    .json(
      new ApiResponse(201, 'User registered success,fully.', {
        user: authPayload.user,
        accessToken: authPayload.accessToken
      })
    );
};

const login = async (req, res) => {
  const authPayload = await authService.loginUser(req.body.email, req.body.password);

  res
    .cookie('refreshToken', authPayload.refreshToken, buildRefreshCookieOptions())
    .status(200)
    .json(
      new ApiResponse(200, 'User logged in successfully.', {
        user: authPayload.user,
        accessToken: authPayload.accessToken
      })
    );
};

const logout = async (req, res) => {
  await authService.logoutUser(req.user._id);

  res
    .clearCookie('refreshToken', buildRefreshCookieOptions())
    .status(200)
    .json(new ApiResponse(200, 'User logged out successfully.', null));
};

const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  const authPayload = await authService.refreshAccessToken(incomingRefreshToken);

  res
    .status(200)
    .json(new ApiResponse(200, 'Access token refreshed successfully.', authPayload));
};

module.exports = {
  register,
  login,
  logout,
  refreshToken
};
