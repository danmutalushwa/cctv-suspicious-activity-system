const express = require('express');
const router = express.Router();
const User = require('../models/User.js'); 
const ApiResponse = require('../utils/response');

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    // 1. Parse pagination queries with safe fallbacks
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 2. Run queries in parallel for efficiency
    const [users, totalItems] = await Promise.all([
      User.find()
        .select('-password') // Exclude password hashes for security
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // Newest users first
      User.countDocuments()
    ]);

    // 3. Return structured response
    ApiResponse.success(res, {
      users,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    }, 'Users fetched successfully');

  } catch (error) {
    next(error); // Sends errors straight to your global handler in app.js
  }
});

module.exports = router;
