const mongoose = require('mongoose');

const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/pagination');
const User = require('../users/user.model');
const Project = require('./project.model');
const Task = require('../tasks/task.model');

const PROJECT_POPULATE = [
  { path: 'owner', select: 'name email role' },
  { path: 'members', select: 'name email role' }
];

const validateObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`Invalid ${fieldName}.`);
  }
};

const ensureProjectIsWritable = (project, actionLabel) => {
  if (project.status === 'archived') {
    throw ApiError.forbidden(`Archived projects are read-only. Cannot ${actionLabel}.`);
  }
};

const normalizeProjectPayload = (payload) => {
  const normalizedPayload = {};

  if (typeof payload.title !== 'undefined') {
    normalizedPayload.title = String(payload.title).trim();
  }

  if (typeof payload.description !== 'undefined') {
    normalizedPayload.description = String(payload.description).trim();
  }

  if (typeof payload.status !== 'undefined') {
    normalizedPayload.status = String(payload.status).trim();
  }

  return normalizedPayload;
};

const sanitizeProjectUpdates = (project, payload) => {
  const updates = normalizeProjectPayload(payload);

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('At least one project field must be provided.');
  }

  if (typeof updates.title !== 'undefined' && updates.title.length < 2) {
    throw ApiError.badRequest('Project title must be at least 2 characters long.');
  }

  if (typeof updates.status !== 'undefined' && !['active', 'archived'].includes(updates.status)) {
    throw ApiError.badRequest('Project status must be either "active" or "archived".');
  }

  if (project.status === 'archived') {
    const attemptedFields = Object.keys(updates);
    const isOnlyUnarchiveTransition =
      attemptedFields.length === 1 && attemptedFields[0] === 'status' && updates.status === 'active';

    if (!isOnlyUnarchiveTransition) {
      throw ApiError.forbidden(
        'Archived projects are read-only. Only the status can be changed back to active.'
      );
    }
  }

  return updates;
};

const getAccessFilter = (userId) => ({
  $or: [{ owner: userId }, { members: userId }]
});

const getAccessibleProjectById = async (projectId, userId) => {
  validateObjectId(projectId, 'project id');

  const project = await Project.findOne({
    _id: projectId,
    ...getAccessFilter(userId)
  }).populate(PROJECT_POPULATE);

  if (!project) {
    throw ApiError.forbidden('You do not have access to this project.');
  }

  return project;
};

const getOwnedProjectById = async (projectId, ownerId) => {
  validateObjectId(projectId, 'project id');

  const project = await Project.findOne({
    _id: projectId,
    owner: ownerId
  }).populate(PROJECT_POPULATE);

  if (!project) {
    throw ApiError.forbidden('Only the project owner can perform this action.');
  }

  return project;
};

const createProject = async (userId, data) => {
  const normalizedData = normalizeProjectPayload(data);

  if (!normalizedData.title || normalizedData.title.length < 2) {
    throw ApiError.badRequest('Project title is required and must be at least 2 characters long.');
  }

  if (normalizedData.status && normalizedData.status !== 'active') {
    throw ApiError.badRequest('New projects can only be created with active status.');
  }

  const project = await Project.create({
    title: normalizedData.title,
    description: normalizedData.description || '',
    owner: userId
  });

  return Project.findById(project._id).populate(PROJECT_POPULATE);
};

const getAllProjects = async (userId, queryParams) => {
  const filter = getAccessFilter(userId);

  if (queryParams.status) {
    if (!['active', 'archived'].includes(queryParams.status)) {
      throw ApiError.badRequest('Project status must be either "active" or "archived".');
    }

    filter.status = queryParams.status;
  }

  const query = Project.find(filter)
    .populate(PROJECT_POPULATE)
    .sort({ updatedAt: -1 });

  return paginate(query, queryParams.page, queryParams.limit);
};

const getProjectById = async (projectId, userId) => {
  return getAccessibleProjectById(projectId, userId);
};

const updateProject = async (projectId, userId, data) => {
  const project = await getOwnedProjectById(projectId, userId);
  const updates = sanitizeProjectUpdates(project, data);

  Object.assign(project, updates);
  await project.save();

  return Project.findById(project._id).populate(PROJECT_POPULATE);
};

const deleteProject = async (projectId, userId) => {
  const project = await getOwnedProjectById(projectId, userId);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  return project;
};

const addMember = async (projectId, ownerId, memberEmail) => {
  const project = await getOwnedProjectById(projectId, ownerId);
  ensureProjectIsWritable(project, 'add members');

  const normalizedEmail = String(memberEmail || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw ApiError.badRequest('Member email is required.');
  }

  const member = await User.findOne({
    email: normalizedEmail,
    isActive: true
  });

  if (!member) {
    throw ApiError.notFound('Member user was not found.');
  }

  if (project.owner._id.toString() === member._id.toString()) {
    throw ApiError.badRequest('Project owner is already the owner and cannot be added as a member.');
  }

  const alreadyMember = project.members.some(
    (existingMember) => existingMember._id.toString() === member._id.toString()
  );

  if (alreadyMember) {
    throw ApiError.badRequest('This user is already a project member.');
  }

  project.members.push(member._id);
  await project.save();

  return Project.findById(project._id).populate(PROJECT_POPULATE);
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  getAccessibleProjectById,
  getOwnedProjectById,
  ensureProjectIsWritable
};
