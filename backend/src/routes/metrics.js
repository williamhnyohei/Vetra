/**
 * Metrics Routes
 * Prometheus metrics endpoint
 */

const express = require('express');
const { register } = require('../config/prometheus');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Prometheus metrics endpoint
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
    });
  }
});

// Health check for metrics
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
