const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional({ values: 'falsy' }).isMobilePhone('any').withMessage('Invalid phone number'),
  ],
  validate,
  ctrl.signup
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  ],
  validate,
  ctrl.verifyOtp
);

router.post(
  '/resend-otp',
  [body('email').isEmail(), body('purpose').isIn(['signup', 'password_reset'])],
  validate,
  ctrl.resendOtp
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  ctrl.login
);

router.post('/forgot-password', [body('email').isEmail()], validate, ctrl.forgotPassword);

router.post(
  '/reset-password',
  [
    body('email').isEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  ctrl.resetPassword
);

module.exports = router;
