const mongoose = require('mongoose');

const config = require('../../config/config');
const ApiError = require('../../utils/ApiError');
const { deleteCache, deleteCacheByPattern, getCache, setCache } = require('../../utils/cache');
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

const buildProjectsListCacheKey = (userId, queryParams = {}) => {
  return `projects:${userId}:page:${queryParams.page || 1}:limit:${queryParams.limit || 10}:status:${queryParams.status || 'all'}`;
};

const buildProjectDetailCacheKey = (projectId, userId) => {
  return `project:${projectId}:user:${userId}`;
};

const invalidateProjectListCachesForUsers = async (userIds) => {
  const uniqueUserIds = [...new Set(userIds.map((userId) => userId.toString()))];

  await Promise.all(
    uniqueUserIds.map((userId) => deleteCacheByPattern(`projects:${userId}:*`))
  );
};

const invalidateProjectCaches = async (project) => {
  const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
  const memberIds = project.members.map((member) => (member._id ? member._id.toString() : member.toString()));
  const relatedUserIds = [ownerId, ...memberIds];

  await Promise.all([
    ...relatedUserIds.map((userId) => deleteCache(buildProjectDetailCacheKey(project._id, userId))),
    invalidateProjectListCachesForUsers(relatedUserIds)
  ]);
};

const getAccessibleProjectById = async (projectId, userId) => {
  validateObjectId(projectId, 'project id');

  const cacheKey = buildProjectDetailCacheKey(projectId, userId);
  const cachedProject = await getCache(cacheKey);

  if (cachedProject) {
    return cachedProject;
  }

  const project = await Project.findOne({
    _id: projectId,
    ...getAccessFilter(userId)
  }).populate(PROJECT_POPULATE);

  if (!project) {
    throw ApiError.forbidden('You do not have access to this project.');
  }

  await setCache(cacheKey, project.toJSON(), config.redis.cacheTtlSeconds);

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

  const hydratedProject = await Project.findById(project._id).populate(PROJECT_POPULATE);
  await invalidateProjectListCachesForUsers([userId]);

  return hydratedProject;
};

const getAllProjects = async (userId, queryParams) => {
  const cacheKey = buildProjectsListCacheKey(userId, queryParams);
  const cachedProjects = await getCache(cacheKey);

  if (cachedProjects) {
    return cachedProjects;
  }

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

  const paginatedProjects = await paginate(query, queryParams.page, queryParams.limit);
  await setCache(cacheKey, paginatedProjects, config.redis.cacheTtlSeconds);

  return paginatedProjects;
};

const getProjectById = async (projectId, userId) => {
  return getAccessibleProjectById(projectId, userId);
};

const updateProject = async (projectId, userId, data) => {
  const project = await getOwnedProjectById(projectId, userId);
  const updates = sanitizeProjectUpdates(project, data);

  Object.assign(project, updates);
  await project.save();

  const hydratedProject = await Project.findById(project._id).populate(PROJECT_POPULATE);
  await invalidateProjectCaches(hydratedProject);

  return hydratedProject;
};

const deleteProject = async (projectId, userId) => {
  const project = await getOwnedProjectById(projectId, userId);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  await invalidateProjectCaches(project);

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

  const hydratedProject = await Project.findById(project._id).populate(PROJECT_POPULATE);
  await invalidateProjectCaches(hydratedProject);

  return hydratedProject;
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
