const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateEmail,
  validate
} = require('../validators/auth.validator');
const { USER_ROLES } = require('../config/constants');

// Public routes
router.post(
  '/register',
  validateRegister,
  validate,
  authController.register
);

router.post(
  '/login',
  validateLogin,
  validate,
  authController.login
);

router.post(
  '/forgot-password',
  validateEmail,
  validate,
  authController.forgotPassword
);

// Protected routes
router.use(protect);

router.get('/me', authController.getMe);

router.put(
  '/profile',
  authController.updateProfile
);

router.put(
  '/change-password',
  validatePasswordChange,
  validate,
  authController.changePassword
);

router.post('/logout', authController.logout);

// Admin only routes
router.get(
  '/users',
  restrictTo(USER_ROLES.ADMIN),
  (req, res) => {
    // TODO: Implement get all users
    res.json({ message: 'Get all users - Admin only' });
  }
);

module.exports = router;