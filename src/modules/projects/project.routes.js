const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const projectController = require('./project.controller');

const router = express.Router();

router.use(verifyJWT);

router.get('/', asyncWrapper(projectController.getAllProjects));
router.post('/', asyncWrapper(projectController.createProject));
router.get('/:id', asyncWrapper(projectController.getProjectById));
router.put('/:id', asyncWrapper(projectController.updateProject));
router.delete('/:id', asyncWrapper(projectController.deleteProject));
router.post('/:id/members', asyncWrapper(projectController.addMember));

module.exports = router;
