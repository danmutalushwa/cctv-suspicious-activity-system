const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api/v1';
  }

  /**
   * Check if the AI service is healthy
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        status: 503,
        error: error.message
      };
    }
  }

  /**
   * Check if the AI service is ready
   */
  async readinessCheck() {
    try {
      const response = await fetch(`${this.baseURL}/ready`);

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        status: 503,
        error: error.message
      };
    }
  }

  /**
   * Get information about the AI model
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${this.baseURL}/model-info`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || 'Failed to get model information'
        );
      }

      return data;
    } catch (error) {
      throw new Error(`AI model info error: ${error.message}`);
    }
  }

  /**
   * Send an image to the AI service for object detection
   *
   * @param {Buffer} imageBuffer - Image data
   * @param {string} filename - Original filename
   */
  async detect(imageBuffer, filename = 'frame.jpg') {
    try {
      const formData = new FormData();

      const blob = new Blob([imageBuffer], {
        type: 'image/jpeg'
      });

      formData.append('file', blob, filename);

      const response = await fetch(`${this.baseURL}/detect`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || 'Object detection failed'
        );
      }

      return data;
    } catch (error) {
      throw new Error(`AI detection error: ${error.message}`);
    }
  }

  /**
   * Send an image to the AI service for object tracking
   *
   * @param {Buffer} imageBuffer - Image data
   * @param {string} filename - Original filename
   */
  async track(imageBuffer, filename = 'frame.jpg') {
    try {
      const formData = new FormData();

      const blob = new Blob([imageBuffer], {
        type: 'image/jpeg'
      });

      formData.append('file', blob, filename);

      const response = await fetch(`${this.baseURL}/track`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || 'Object tracking failed'
        );
      }

      return data;
    } catch (error) {
      throw new Error(`AI tracking error: ${error.message}`);
    }
  }

  /**
   * Send an image to the AI service for suspicious activity detection
   *
   * @param {Buffer} imageBuffer - Image data
   * @param {string} filename - Original filename
   */
  async detectSuspiciousActivity(
    imageBuffer,
    filename = 'frame.jpg'
  ) {
    try {
      const formData = new FormData();

      const blob = new Blob([imageBuffer], {
        type: 'image/jpeg'
      });

      formData.append('file', blob, filename);

      const response = await fetch(
        `${this.baseURL}/detect-suspicious`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          'Suspicious activity detection failed'
        );
      }

      return data;
    } catch (error) {
      throw new Error(
        `Suspicious activity detection error: ${error.message}`
      );
    }
  }

  /**
   * Analyze multiple extracted video frames
   * @param {string[]} framePaths - Paths to extracted frames
   * @returns {Promise<object[]>} AI results for each frame
   */
  async analyzeFrames(framePaths) {
    const fs = require('fs');
    const path = require('path');

    const results = [];

    for (let i = 0; i < framePaths.length; i++) {
      const framePath = framePaths[i];

      try {
        const imageBuffer = fs.readFileSync(framePath);
        const filename = path.basename(framePath);

        const result = await this.detectSuspiciousActivity(
          imageBuffer,
          filename
        );

        results.push({
          frame: filename,
          framePath,
          ...result
        });

        // Small delay to avoid overwhelming the AI service
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        logger.error(
          `AI analysis failed for frame ${framePath}: ${error.message}`
        );

        results.push({
          frame: path.basename(framePath),
          framePath,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new AIService();