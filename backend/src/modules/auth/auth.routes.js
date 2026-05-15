const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimiter');
const validate = require('../../middlewares/validate');
const authController = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');

const router = express.Router();

router.post('/register', authLimiter, registerValidation, validate, asyncWrapper(authController.register));
router.post('/login', authLimiter, loginValidation, validate, asyncWrapper(authController.login));
router.post('/logout', verifyJWT, asyncWrapper(authController.logout));
router.post('/refresh-token', asyncWrapper(authController.refreshToken));

module.exports = router;
