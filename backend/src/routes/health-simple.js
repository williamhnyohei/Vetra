/**
 * Simple Health Check Routes (for Railway deployment)
 * Basic health check without database dependencies
 */

const express = require('express');
const router = express.Router();

// Simple health check (no database dependencies)
router.get('/', (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
