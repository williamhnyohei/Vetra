/**
 * Multi-Agent System Status Routes
 * Check MAS health and configuration
 */

const express = require('express');
const { getMASStatus } = require('../services/multiAgentSystemMock');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/mas/status
 * Get Multi-Agent System status
 */
router.get('/status', async (req, res) => {
  try {
    const status = getMASStatus();
    
    res.json({
      success: true,
      mas: status,
    });
  } catch (error) {
    logger.error('MAS status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MAS status',
    });
  }
});

module.exports = router;

