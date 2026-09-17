const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, organization, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.conflict(res, 'User with this email already exists');
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      organization,
      phoneNumber,
      isVerified: true // Set to false if email verification is required
    });

    // Generate token
    const token = generateToken(user);

    // Log registration
    logger.info(`New user registered: ${user.email} (${user.role})`);

    // Return user data (excluding password)
    const userData = user.getPublicProfile();

    ApiResponse.created(res, {
      user: userData,
      token
    }, 'User registered successfully');
  } catch (error) {
    logger.error('Registration error:', error);
    ApiResponse.error(res, error, 'Registration failed');
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return ApiResponse.unauthorized(res, 'Your account has been deactivated. Please contact support');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Log login
    logger.info(`User logged in: ${user.email}`);

    // Return user data (excluding password)
    const userData = user.getPublicProfile();

    ApiResponse.success(res, {
      user: userData,
      token
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    ApiResponse.error(res, error, 'Login failed');
  }
};

/**
 * Get current user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    ApiResponse.success(res, {
      user: user.getPublicProfile()
    }, 'User profile retrieved successfully');
  } catch (error) {
    logger.error('Get profile error:', error);
    ApiResponse.error(res, error, 'Failed to retrieve user profile');
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, organization, phoneNumber, preferences } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (organization) user.organization = organization;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();

    logger.info(`User profile updated: ${user.email}`);

    ApiResponse.success(res, {
      user: user.getPublicProfile()
    }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    ApiResponse.error(res, error, 'Failed to update profile');
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return ApiResponse.badRequest(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    // Generate new token
    const token = generateToken(user);

    ApiResponse.success(res, {
      token
    }, 'Password changed successfully');
  } catch (error) {
    logger.error('Change password error:', error);
    ApiResponse.error(res, error, 'Failed to change password');
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // If using token blacklist, add token to blacklist here
    // For JWT, client-side token removal is sufficient

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    logger.error('Logout error:', error);
    ApiResponse.error(res, error, 'Logout failed');
  }
};

/**
 * Forgot password - send reset link
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return ApiResponse.success(res, null, 'If an account with this email exists, a password reset link will be sent');
    }

    // Generate reset token (simplified - implement proper token generation)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset link
    // For now, just return success

    logger.info(`Password reset requested for: ${user.email}`);

    ApiResponse.success(res, {
      // In production, don't send token in response
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    }, 'Password reset link sent to your email');
  } catch (error) {
    logger.error('Forgot password error:', error);
    ApiResponse.error(res, error, 'Failed to process password reset request');
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword
};