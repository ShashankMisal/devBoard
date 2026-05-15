const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const projectController = require('./project.controller');
const {
  createProjectValidation,
  updateProjectValidation,
  addProjectMemberValidation
} = require('./project.validation');

const router = express.Router();

router.use(verifyJWT);

router.get('/', asyncWrapper(projectController.getAllProjects));
router.post('/', createProjectValidation, validate, asyncWrapper(projectController.createProject));
router.get('/:id', asyncWrapper(projectController.getProjectById));
router.put('/:id', updateProjectValidation, validate, asyncWrapper(projectController.updateProject));
router.delete('/:id', asyncWrapper(projectController.deleteProject));
router.post('/:id/members', addProjectMemberValidation, validate, asyncWrapper(projectController.addMember));

module.exports = router;
