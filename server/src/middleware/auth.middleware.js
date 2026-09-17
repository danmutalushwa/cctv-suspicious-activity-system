const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }else if (req.query.token) {
      // Allow token via query for streaming endpoints
      token = req.query.token;
    }

    // Check if token exists
    if (!token) {
      return ApiResponse.unauthorized(res, 'You are not logged in. Please log in to access this resource');
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token. Please log in again');
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return ApiResponse.unauthorized(res, 'The user belonging to this token no longer exists');
    }

    // Check if user is active
    if (!user.isActive) {
      return ApiResponse.unauthorized(res, 'Your account has been deactivated. Please contact support');
    }

    // Check if user changed password after token was issued
    if (user.isPasswordChangedAfterJWT(decoded.iat)) {
      return ApiResponse.unauthorized(res, 'Password recently changed. Please log in again');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return ApiResponse.error(res, error, 'Authentication failed', HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action');
    }

    next();
  };
};

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      } catch (error) {
        // Token invalid but we don't block the request
        console.log('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    next(); // Continue even if error
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};