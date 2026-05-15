const User = require('./user.model');
const ApiError = require('../../utils/ApiError');

const sanitizeUserFields = (userDocument) => {
  return userDocument.toJSON();
};

const getProfile = (user) => {
  return sanitizeUserFields(user);
};

const updateProfile = async (userId, updateData) => {
  const disallowedFields = ['password', 'role', 'refreshToken', 'isActive'];
  const attemptedRestrictedField = disallowedFields.find((field) => field in updateData);

  if (attemptedRestrictedField) {
    throw ApiError.badRequest(`Field "${attemptedRestrictedField}" cannot be updated here.`);
  }

  const permittedUpdates = {};

  if (typeof updateData.name !== 'undefined') {
    permittedUpdates.name = String(updateData.name).trim();
  }

  if (typeof updateData.email !== 'undefined') {
    permittedUpdates.email = String(updateData.email).trim().toLowerCase();
  }

  if (Object.keys(permittedUpdates).length === 0) {
    throw ApiError.badRequest('At least one allowed field must be provided for update.');
  }

  if (permittedUpdates.name && permittedUpdates.name.length < 2) {
    throw ApiError.badRequest('Name must be at least 2 characters long.');
  }

  if (permittedUpdates.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(permittedUpdates.email)) {
      throw ApiError.badRequest('Please provide a valid email address.');
    }

    const existingUser = await User.findOne({
      email: permittedUpdates.email,
      _id: { $ne: userId }
    });

    if (existingUser) {
      throw ApiError.badRequest('Email is already in use.');
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      isActive: true
    },
    permittedUpdates,
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedUser) {
    throw ApiError.notFound('Active user account was not found.');
  }

  return sanitizeUserFields(updatedUser);
};

const softDeleteProfile = async (userId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      isActive: true
    },
    {
      isActive: false,
      refreshToken: null
    },
    {
      new: true
    }
  ).select('+refreshToken');

  if (!user) {
    throw ApiError.notFound('Active user account was not found.');
  }

  return sanitizeUserFields(user);
};

module.exports = {
  getProfile,
  updateProfile,
  softDeleteProfile
};
