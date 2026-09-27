const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/env');
const logger = require('../utils/logger');

const AI_URL = config.aiServiceUrl || 'http://localhost:5001';
const API_KEY = config.aiApiKey || 'your-secret-api-key-here';

class AIService { 
  async _post(endpoint, imageInput) {
    const form = new FormData();

    if (typeof imageInput === 'string') {
      form.append(
        'file',
        fs.createReadStream(imageInput)
      );
    } else {
      form.append('file', imageInput, {
        filename: 'frame.jpg',
        contentType: 'image/jpeg',
      });
    }

    const response = await axios.post(
      `${AI_URL}${endpoint}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': API_KEY,
        },
        timeout: 60000,
        maxBodyLength: Infinity,
      }
    );

    return response.data;
  }

  detectObjects(image) {
    return this._post(
      '/api/v1/detect',
      image
    );
  }

  trackObjects(image) {
    return this._post(
      '/api/v1/track',
      image
    );
  }

  detectSuspiciousActivity(image) {
    return this._post(
      '/api/v1/detect-suspicious',
      image
    );
  }

  async analyzeFrames(framePaths) {
    const results = [];

    for (const framePath of framePaths) {
      try {
        logger.info(
          `Analyzing AI frame: ${framePath}`
        );

        const result =
          await this.detectSuspiciousActivity(
            framePath
          );

        results.push({
          ...result,
          framePath
        });

      } catch (error) {
        logger.error(
          `AI frame analysis failed for ${framePath}:`,
          error.message
        );

        results.push({
          success: false,
          framePath,
          error: error.message
        });
      }
    }

    return results;
  }

  async healthCheck() {
    try {
      const res = await axios.get(
        `${AI_URL}/api/v1/health`,
        { timeout: 5000 }
      );

      return res.data.status === 'healthy';

    } catch (error) {
      logger.error(
        'AI health check failed:',
        error.message
      );

      return false;
    }
  }

  async getModelInfo() {
    const res = await axios.get(
      `${AI_URL}/api/v1/model-info`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    return res.data;
  }
}

module.exports = new AIService();