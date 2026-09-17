const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../config/constants');

class ApiResponse {
  static success(res, data = null, message = RESPONSE_MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, error, message = RESPONSE_MESSAGES.ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    const errorMessage = error.message || message;
    
    // Log error details
    console.error('API Error:', {
      statusCode,
      message: errorMessage,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }

  static badRequest(res, message = RESPONSE_MESSAGES.VALIDATION_ERROR) {
    return this.error(res, new Error(message), message, HTTP_STATUS.BAD_REQUEST);
  }

  static unauthorized(res, message = RESPONSE_MESSAGES.UNAUTHORIZED) {
    return this.error(res, new Error(message), message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res, message = RESPONSE_MESSAGES.FORBIDDEN) {
    return this.error(res, new Error(message), message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res, message = RESPONSE_MESSAGES.NOT_FOUND) {
    return this.error(res, new Error(message), message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res, message = RESPONSE_MESSAGES.DUPLICATE) {
    return this.error(res, new Error(message), message, HTTP_STATUS.CONFLICT);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
}

module.exports = ApiResponse;