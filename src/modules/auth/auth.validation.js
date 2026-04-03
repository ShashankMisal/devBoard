const { body } = require('express-validator');

const passwordPolicyRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .matches(passwordPolicyRegex)
    .withMessage(
      'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.'
    )
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

module.exports = {
  registerValidation,
  loginValidation
};
