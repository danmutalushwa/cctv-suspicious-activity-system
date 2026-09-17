const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

// Create transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    // 1. Force the host to 'smtp.gmail.com' as an explicit, literal string string
    const smtpHost = 'smtp.gmail.com';
    const smtpPort = 587;
    
    // 2. Read the user credentials straight from process.env with clear, default inline fallbacks
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'your_actual_email@gmail.com';
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || 'your16characterapppassword';

    transporter = nodemailer.createTransport({
      host: smtpHost, // This is now safely locked to 'smtp.gmail.com'
      port: smtpPort,
      secure: false, // Must stay false for port 587
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false // Prevents local self-signed certificate blocking
      }
    });
    
    logger.info('Email transporter forced to hardcoded clean strings.');
  }
  return transporter;
};




/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise}
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.warn('Email sending skipped - no transporter configured');
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"CCTV Security System" <${config.smtp.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
      attachments: options.attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    
    return { success: true, info };
  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send alert notification email
 * @param {Object} alert - Alert data
 * @param {Object} user - User data
 * @param {Object} incident - Incident data (optional)
 */
const sendAlertEmail = async (alert, user, incident = null) => {
  const subject = `[${alert.priority.toUpperCase()}] ${alert.title}`;
  
  const text = `
    Alert Notification
    -----------------
    Priority: ${alert.priority}
    Title: ${alert.title}
    Message: ${alert.message}
    
    ${incident ? `
    Incident Details:
    -----------------
    Incident Number: ${incident.incidentNumber || 'N/A'}
    Type: ${incident.type || 'N/A'}
    Location: ${incident.location?.address || 'N/A'}
    Time: ${new Date(alert.createdAt).toLocaleString()}
    ` : ''}
    
    Please login to the system to view more details.
    ${alert.metadata?.cameraName ? `Camera: ${alert.metadata.cameraName}` : ''}
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${alert.priority === 'critical' ? '#dc3545' : alert.priority === 'high' ? '#fd7e14' : '#007bff'}; 
                  color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .priority-badge { display: inline-block; padding: 5px 10px; 
                         background: ${alert.priority === 'critical' ? '#dc3545' : alert.priority === 'high' ? '#fd7e14' : '#007bff'}; 
                         color: white; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Security Alert</h1>
          <span class="priority-badge">${alert.priority.toUpperCase()}</span>
        </div>
        <div class="content">
          <h2>${alert.title}</h2>
          <p>${alert.message}</p>
          
          ${incident ? `
          <hr>
          <h3>Incident Details</h3>
          <ul>
            <li><strong>Number:</strong> ${incident.incidentNumber || 'N/A'}</li>
            <li><strong>Type:</strong> ${incident.type || 'N/A'}</li>
            <li><strong>Location:</strong> ${incident.location?.address || 'N/A'}</li>
            <li><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</li>
            ${alert.metadata?.cameraName ? `<li><strong>Camera:</strong> ${alert.metadata.cameraName}</li>` : ''}
          </ul>
          ` : ''}
          
          <p><a href="${config.clientUrl}/alerts/${alert._id}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Alert</a></p>
        </div>
        <div class="footer">
          <p>This is an automated notification from CCTV Security System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send bulk emails
 * @param {Array} users - Array of user objects
 * @param {Object} alert - Alert data
 * @param {Object} incident - Incident data (optional)
 */
const sendBulkAlertEmails = async (users, alert, incident = null) => {
  const results = [];
  
  for (const user of users) {
    if (user.email && user.preferences?.notifications?.email !== false) {
      const result = await sendAlertEmail(alert, user, incident);
      results.push({
        userId: user._id,
        email: user.email,
        success: result.success,
        error: result.error
      });
    }
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendAlertEmail,
  sendBulkAlertEmails
};