const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const taskController = require('./task.controller');
const { createTaskValidation, updateTaskValidation } = require('./task.validation');

const projectTaskRouter = express.Router({ mergeParams: true });
const taskRouter = express.Router();

projectTaskRouter.use(verifyJWT);
taskRouter.use(verifyJWT);

projectTaskRouter.get('/', asyncWrapper(taskController.getTasksByProject));
projectTaskRouter.post('/', createTaskValidation, validate, asyncWrapper(taskController.createProjectTask));

taskRouter.get('/:id', asyncWrapper(taskController.getTaskById));
taskRouter.put('/:id', updateTaskValidation, validate, asyncWrapper(taskController.updateTask));
taskRouter.delete('/:id', asyncWrapper(taskController.deleteTask));

module.exports = {
  projectTaskRouter,
  taskRouter
};
