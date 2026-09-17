const express = require('express');
const router = express.Router();
const { sendAlertEmail } = require('../services/email.service');
const { protect } = require('../middleware/auth.middleware');
const ApiResponse = require('../utils/response');

router.post('/test-email', protect, async (req, res) => {
  try {
    const user = req.user;
    const testAlert = {
      _id: 'test123',
      title: 'Test Email Notification',
      message: 'This is a test email from the CCTV Suspicious Activity Detection System.',
      priority: 'high',
      createdAt: new Date()
    };

    const result = await sendAlertEmail(testAlert, user);
    
    if (result.success) {
      ApiResponse.success(res, result, 'Test email sent successfully');
    } else {
      ApiResponse.error(res, new Error(result.error), 'Failed to send test email');
    }
  } catch (error) {
    ApiResponse.error(res, error, 'Error sending test email');
  }
});

module.exports = router;