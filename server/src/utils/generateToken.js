const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate refresh token (optional, for future use)
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '30d'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};