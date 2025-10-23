/**
 * Simple Health Check Routes
 * Basic health monitoring without external dependencies
 */

const express = require('express');
const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

module.exports = router;
