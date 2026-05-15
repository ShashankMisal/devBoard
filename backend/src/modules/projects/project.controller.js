const ApiResponse = require('../../utils/ApiResponse');
const projectService = require('./project.service');

const createProject = async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  const response = new ApiResponse(201, 'Project created successfully.', project);

  res.status(response.statusCode).json(response);
};

const getAllProjects = async (req, res) => {
  const projects = await projectService.getAllProjects(req.user._id, req.query);
  const response = new ApiResponse(200, 'Projects fetched successfully.', projects);

  res.status(response.statusCode).json(response);
};

const getProjectById = async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user._id);
  const response = new ApiResponse(200, 'Project fetched successfully.', project);

  res.status(response.statusCode).json(response);
};

const updateProject = async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user._id, req.body);
  const response = new ApiResponse(200, 'Project updated successfully.', project);

  res.status(response.statusCode).json(response);
};

const deleteProject = async (req, res) => {
  const project = await projectService.deleteProject(req.params.id, req.user._id);
  const response = new ApiResponse(200, 'Project deleted successfully.', project);

  res.status(response.statusCode).json(response);
};

const addMember = async (req, res) => {
  const project = await projectService.addMember(req.params.id, req.user._id, req.body.email);
  const response = new ApiResponse(200, 'Project member added successfully.', project);

  res.status(response.statusCode).json(response);
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember
};
