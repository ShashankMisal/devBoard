const ApiResponse = require('../../utils/ApiResponse');
const userService = require('./user.service');

const getMe = async (req, res) => {
  const user = await userService.getProfile(req.user);
  const response = new ApiResponse(200, 'User profile fetched successfully.', user);

  res.status(response.statusCode).json(response);
};

const updateMe = async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  const response = new ApiResponse(200, 'User profile updated successfully.', user);

  res.status(response.statusCode).json(response);
};

const deleteMe = async (req, res) => {
  const user = await userService.softDeleteProfile(req.user._id);
  const response = new ApiResponse(200, 'User profile deactivated successfully.', user);

  res.status(response.statusCode).json(response);
};

module.exports = {
  getMe,
  updateMe,
  deleteMe
};
