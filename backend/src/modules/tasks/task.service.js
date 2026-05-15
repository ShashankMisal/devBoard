const mongoose = require('mongoose');

const ApiError = require('../../utils/ApiError');
const paginate = require('../../utils/pagination');
const User = require('../users/user.model');
const Task = require('./task.model');
const projectService = require('../projects/project.service');

const TASK_POPULATE = [
  { path: 'project', select: 'title status owner members' },
  { path: 'assignee', select: 'name email role' },
  { path: 'createdBy', select: 'name email role' }
];

const parseDateOrThrow = (dateValue, fieldLabel) => {
  if (typeof dateValue === 'undefined' || dateValue === null || dateValue === '') {
    return null;
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw ApiError.badRequest(`${fieldLabel} must be a valid date.`);
  }

  return parsedDate;
};

const validateTaskUpdates = (payload) => {
  const updates = {};

  if (typeof payload.title !== 'undefined') {
    updates.title = String(payload.title).trim();

    if (updates.title.length < 2) {
      throw ApiError.badRequest('Task title must be at least 2 characters long.');
    }
  }

  if (typeof payload.description !== 'undefined') {
    updates.description = String(payload.description).trim();
  }

  if (typeof payload.status !== 'undefined') {
    updates.status = String(payload.status).trim();

    if (!['todo', 'in-progress', 'done'].includes(updates.status)) {
      throw ApiError.badRequest('Task status must be todo, in-progress, or done.');
    }
  }

  if (typeof payload.priority !== 'undefined') {
    updates.priority = String(payload.priority).trim();

    if (!['low', 'medium', 'high'].includes(updates.priority)) {
      throw ApiError.badRequest('Task priority must be low, medium, or high.');
    }
  }

  if (typeof payload.dueDate !== 'undefined') {
    updates.dueDate = parseDateOrThrow(payload.dueDate, 'Due date');
  }

  if (typeof payload.assignee !== 'undefined') {
    if (payload.assignee === null || payload.assignee === '') {
      updates.assignee = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(payload.assignee)) {
        throw ApiError.badRequest('Invalid assignee id.');
      }

      updates.assignee = payload.assignee;
    }
  }

  return updates;
};

const validateAssigneeAccess = async (project, assigneeId) => {
  if (!assigneeId) {
    return null;
  }

  const assignee = await User.findOne({
    _id: assigneeId,
    isActive: true
  });

  if (!assignee) {
    throw ApiError.badRequest('Assignee user was not found.');
  }

  const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
  const isProjectMember = project.members.some((member) => {
    const memberId = member._id ? member._id.toString() : member.toString();
    return memberId === assignee._id.toString();
  });

  if (assignee._id.toString() !== ownerId && !isProjectMember) {
    throw ApiError.badRequest('Assignee must be the project owner or a current project member.');
  }

  return assignee;
};

const getTaskByIdWithRelations = async (taskId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw ApiError.badRequest('Invalid task id.');
  }

  const task = await Task.findById(taskId).populate(TASK_POPULATE);

  if (!task) {
    throw ApiError.notFound('Task was not found.');
  }

  return task;
};

const buildBaseTaskFilter = (projectId) => {
  return {
    project: projectId
  };
};

const createProjectTask = async (projectId, userId, data) => {
  const project = await projectService.getAccessibleProjectById(projectId, userId);
  projectService.ensureProjectIsWritable(project, 'create tasks');

  const updates = validateTaskUpdates(data);

  if (!updates.title) {
    throw ApiError.badRequest('Task title is required.');
  }

  await validateAssigneeAccess(project, updates.assignee || null);

  const task = await Task.create({
    title: updates.title,
    description: updates.description || '',
    project: project._id,
    assignee: updates.assignee || null,
    createdBy: userId,
    status: updates.status || 'todo',
    priority: updates.priority || 'medium',
    dueDate: typeof updates.dueDate === 'undefined' ? null : updates.dueDate
  });

  return Task.findById(task._id).populate(TASK_POPULATE);
};

const getTasksByProject = async (projectId, userId, queryParams) => {
  const project = await projectService.getAccessibleProjectById(projectId, userId);
  const filter = buildBaseTaskFilter(project._id);

  if (queryParams.status) {
    if (!['todo', 'in-progress', 'done'].includes(queryParams.status)) {
      throw ApiError.badRequest('Task status must be todo, in-progress, or done.');
    }

    filter.status = queryParams.status;
  }

  if (queryParams.priority) {
    if (!['low', 'medium', 'high'].includes(queryParams.priority)) {
      throw ApiError.badRequest('Task priority must be low, medium, or high.');
    }

    filter.priority = queryParams.priority;
  }

  if (queryParams.sortBy === 'priority') {
    const currentPage = Math.max(Number.parseInt(queryParams.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(queryParams.limit, 10) || 10, 1), 50);
    const skip = (currentPage - 1) * limit;
    const totalDocs = await Task.countDocuments(filter);

    const prioritySortedTasks = await Task.aggregate([
      { $match: filter },
      {
        $addFields: {
          priorityRank: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'high'] }, then: 3 },
                { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                { case: { $eq: ['$priority', 'low'] }, then: 1 }
              ],
              default: 0
            }
          }
        }
      },
      { $sort: { priorityRank: -1, dueDate: 1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const taskIds = prioritySortedTasks.map((task) => task._id);
    const hydratedTasks = await Task.find({ _id: { $in: taskIds } }).populate(TASK_POPULATE);
    const hydratedTaskMap = new Map(hydratedTasks.map((task) => [task._id.toString(), task]));
    const orderedTasks = taskIds.map((id) => hydratedTaskMap.get(id.toString())).filter(Boolean);
    const totalPages = totalDocs === 0 ? 0 : Math.ceil(totalDocs / limit);

    return {
      data: orderedTasks,
      totalDocs,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1 && totalPages > 0
    };
  }

  const sort = queryParams.sortBy === 'dueDate' ? { dueDate: 1, createdAt: -1 } : { createdAt: -1 };
  const query = Task.find(filter).populate(TASK_POPULATE).sort(sort);

  return paginate(query, queryParams.page, queryParams.limit);
};

const getTaskById = async (taskId, userId) => {
  const task = await getTaskByIdWithRelations(taskId);
  const projectId = task.project._id ? task.project._id.toString() : task.project.toString();

  await projectService.getAccessibleProjectById(projectId, userId);

  return task;
};

const updateTask = async (taskId, userId, data) => {
  const task = await getTaskByIdWithRelations(taskId);
  const project = await projectService.getAccessibleProjectById(task.project._id, userId);

  projectService.ensureProjectIsWritable(project, 'update tasks');

  const isOwner = project.owner._id.toString() === userId.toString();
  const isAssignee = task.assignee && task.assignee._id.toString() === userId.toString();

  if (!isOwner && !isAssignee) {
    throw ApiError.forbidden('Only the project owner or task assignee can update this task.');
  }

  const updates = validateTaskUpdates(data);

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('At least one task field must be provided.');
  }

  await validateAssigneeAccess(project, Object.prototype.hasOwnProperty.call(updates, 'assignee') ? updates.assignee : task.assignee?._id || null);

  Object.assign(task, updates);
  await task.save();

  return Task.findById(task._id).populate(TASK_POPULATE);
};

const deleteTask = async (taskId, userId) => {
  const task = await getTaskByIdWithRelations(taskId);
  const project = await projectService.getAccessibleProjectById(task.project._id, userId);

  projectService.ensureProjectIsWritable(project, 'delete tasks');

  const isOwner = project.owner._id.toString() === userId.toString();
  const isCreator = task.createdBy._id.toString() === userId.toString();

  if (!isOwner && !isCreator) {
    throw ApiError.forbidden('Only the project owner or task creator can delete this task.');
  }

  await task.deleteOne();

  return task;
};

module.exports = {
  createProjectTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask
};
