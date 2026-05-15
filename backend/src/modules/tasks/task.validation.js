const { body } = require('express-validator');

const allowedStatuses = ['todo', 'in-progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];

const futureDateValidator = (value) => {
  if (value === null || value === '') {
    return true;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Due date must be a valid date.');
  }

  if (parsedDate.getTime() <= Date.now()) {
    throw new Error('Due date must be in the future.');
  }

  return true;
};

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Task title must be between 2 and 120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Task description cannot exceed 1000 characters.'),
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage('Task status must be todo, in-progress, or done.'),
  body('priority')
    .optional()
    .isIn(allowedPriorities)
    .withMessage('Task priority must be low, medium, or high.'),
  body('dueDate')
    .optional({ nullable: true })
    .custom(futureDateValidator),
  body('assignee')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Assignee must be a valid user id.')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Task title must be between 2 and 120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Task description cannot exceed 1000 characters.'),
  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage('Task status must be todo, in-progress, or done.'),
  body('priority')
    .optional()
    .isIn(allowedPriorities)
    .withMessage('Task priority must be low, medium, or high.'),
  body('dueDate')
    .optional({ nullable: true })
    .custom(futureDateValidator),
  body('assignee')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === '' || value === null) {
        return true;
      }

      if (!/^[a-f\d]{24}$/i.test(String(value))) {
        throw new Error('Assignee must be a valid user id.');
      }

      return true;
    })
];

module.exports = {
  createTaskValidation,
  updateTaskValidation
};
