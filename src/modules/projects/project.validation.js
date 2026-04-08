const { body } = require('express-validator');

const allowedStatuses = ['active', 'archived'];

const createProjectValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Project title is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Project title must be between 2 and 120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Project description cannot exceed 1000 characters.')
];

const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Project title must be between 2 and 120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Project description cannot exceed 1000 characters.'),
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage('Project status must be active or archived.')
];

const addProjectMemberValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Member email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail()
];

module.exports = {
  createProjectValidation,
  updateProjectValidation,
  addProjectMemberValidation
};
