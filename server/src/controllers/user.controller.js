const User = require('../models/User');
const ApiResponse = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');

/**
 * GET /api/users
 * Get all users with pagination, search and role filtering
 */
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const { search, role } = req.query;

    const filter = {};

    // Search by name or email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role
    if (role) {
      if (!Object.values(USER_ROLES).includes(role)) {
        return ApiResponse.error(
          res,
          null,
          'Invalid user role',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      filter.role = role;
    }

    const [users, totalItems] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      User.countDocuments(filter),
    ]);

    return ApiResponse.success(
      res,
      {
        users,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
      'Users fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get a single user
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    return ApiResponse.success(
      res,
      { user },
      'User fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Create a new user
 */
const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      organization,
      phoneNumber,
      isActive,
    } = req.body;

    // Basic required-field validation
    if (!name || !email || !password) {
      return ApiResponse.error(
        res,
        null,
        'Name, email and password are required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate role
    const userRole = role || USER_ROLES.OPERATOR;

    if (!Object.values(USER_ROLES).includes(userRole)) {
      return ApiResponse.error(
        res,
        null,
        'Invalid user role',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check duplicate email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return ApiResponse.error(
        res,
        null,
        'A user with this email already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      organization: organization?.trim() || undefined,
      phoneNumber: phoneNumber?.trim() || undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const publicUser = user.getPublicProfile();

    return ApiResponse.success(
      res,
      { user: publicUser },
      'User created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    // Handle MongoDB duplicate-key error
    if (error.code === 11000) {
      return ApiResponse.error(
        res,
        error,
        'A user with this email already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Update a user
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, phoneNumber, isActive } =
      req.body;

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    // Name
    if (name !== undefined) {
      user.name = name.trim();
    }

    // Email
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });

        if (existingUser) {
          return ApiResponse.error(
            res,
            null,
            'A user with this email already exists',
            HTTP_STATUS.CONFLICT
          );
        }

        user.email = normalizedEmail;
      }
    }

    // Role
    if (role !== undefined) {
      if (!Object.values(USER_ROLES).includes(role)) {
        return ApiResponse.error(
          res,
          null,
          'Invalid user role',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      user.role = role;
    }

    // Other fields
    if (organization !== undefined) {
      user.organization = organization.trim();
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber.trim();
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    // Password
    // User model pre-save middleware will hash it.
    if (password) {
      user.password = password;
    }

    await user.save();

    const publicUser = user.getPublicProfile();

    return ApiResponse.success(
      res,
      { user: publicUser },
      'User updated successfully'
    );
  } catch (error) {
    if (error.code === 11000) {
      return ApiResponse.error(
        res,
        error,
        'A user with this email already exists',
        HTTP_STATUS.CONFLICT
      );
    }

    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent an admin from deleting their own account
    if (req.userId.toString() === req.params.id.toString()) {
      return ApiResponse.error(
        res,
        null,
        'You cannot delete your own account',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    await User.findByIdAndDelete(req.params.id);

    return ApiResponse.success(
      res,
      null,
      'User deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/toggle-status
 * Activate/deactivate a user
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    // Prevent an admin from deactivating their own account
    if (req.userId.toString() === req.params.id.toString()) {
      return ApiResponse.error(
        res,
        null,
        'You cannot deactivate your own account',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    user.isActive = !user.isActive;
    await user.save();

    const publicUser = user.getPublicProfile();

    return ApiResponse.success(
      res,
      { user: publicUser },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
};