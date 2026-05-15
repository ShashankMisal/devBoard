const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const userController = require('./user.controller');

const router = express.Router();

router.use(verifyJWT);

router.get('/me', asyncWrapper(userController.getMe));
router.put('/me', asyncWrapper(userController.updateMe));
router.delete('/me', asyncWrapper(userController.deleteMe));

module.exports = router;
