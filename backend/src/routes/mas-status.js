/**
 * Multi-Agent System Status Routes
 * Reports real HTTP health of the configured MAS (not the mock).
 */

const express = require('express');
const { checkMultiAgentHealth, MULTI_AGENT_CONFIG } = require('../services/multiAgentRiskAnalyzer');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/mas/status
 */
router.get('/status', async (req, res) => {
  try {
    const health = await checkMultiAgentHealth();

    res.json({
      success: true,
      mas: {
        mode: health.available ? 'live' : 'unavailable',
        available: health.available,
        analyzeUrl: MULTI_AGENT_CONFIG.apiUrl,
        health: health.data || null,
        error: health.error || null,
        message: health.available
          ? 'Connected to Python Multi-Agent System'
          : 'MAS unreachable — backend will use heuristic fallback',
      },
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
