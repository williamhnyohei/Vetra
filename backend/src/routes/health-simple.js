/**
 * Simple Health Check Routes
 * Basic health monitoring with optional Redis check
 */

const express = require('express');
const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000
    };

    // Optional Redis check if available
    if (process.env.REDIS_URL) {
      try {
        const { redisClient } = require('../config/redis');
        if (redisClient) {
          await redisClient.ping();
          health.redis = 'connected';
        }
      } catch (error) {
        health.redis = 'disconnected';
      }
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
