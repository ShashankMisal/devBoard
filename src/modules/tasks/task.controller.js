const ApiResponse = require('../../utils/ApiResponse');
const taskService = require('./task.service');

const createProjectTask = async (req, res) => {
  const task = await taskService.createProjectTask(req.params.projectId, req.user._id, req.body);
  const response = new ApiResponse(201, 'Task created successfully.', task);

  res.status(response.statusCode).json(response);
};

const getTasksByProject = async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.params.projectId, req.user._id, req.query);
  const response = new ApiResponse(200, 'Tasks fetched successfully.', tasks);

  res.status(response.statusCode).json(response);
};

const getTaskById = async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user._id);
  const response = new ApiResponse(200, 'Task fetched successfully.', task);

  res.status(response.statusCode).json(response);
};

const updateTask = async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.user._id, req.body);
  const response = new ApiResponse(200, 'Task updated successfully.', task);

  res.status(response.statusCode).json(response);
};

const deleteTask = async (req, res) => {
  const task = await taskService.deleteTask(req.params.id, req.user._id);
  const response = new ApiResponse(200, 'Task deleted successfully.', task);

  res.status(response.statusCode).json(response);
};

module.exports = {
  createProjectTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask
};
