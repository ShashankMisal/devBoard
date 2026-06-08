const express = require('express');

const asyncWrapper = require('../../middlewares/asyncWrapper');
const { verifyJWT } = require('../../middlewares/auth');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.use(verifyJWT);

router.get('/summary', asyncWrapper(dashboardController.getSummary));

module.exports = router;
