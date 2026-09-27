const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require('../controllers/user.controller');

const {
  protect,
  restrictTo,
} = require('../middleware/auth.middleware');

const { USER_ROLES } = require('../config/constants');

/*
 * All user-management routes require authentication
 * and are restricted to administrators.
 */
router.use(protect);
router.use(restrictTo(USER_ROLES.ADMIN));

/**
 * GET /api/users
 */
router.get('/', getUsers);

/**
 * POST /api/users
 */
router.post('/', createUser);

/**
 * GET /api/users/:id
 */
router.get('/:id', getUser);

/**
 * PUT /api/users/:id
 */
router.put('/:id', updateUser);

/**
 * DELETE /api/users/:id
 */
router.delete('/:id', deleteUser);

/**
 * PATCH /api/users/:id/toggle-status
 */
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;