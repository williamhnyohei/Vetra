/**
 * WebSocket Routes
 * Real-time communication endpoints
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getConnectedUsersCount, getConnectedUsersStats } = require('../config/websocket');

const router = express.Router();

// Get WebSocket connection stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getConnectedUsersStats();
    
    res.json({
      success: true,
      stats: {
        total: stats.total,
        pro: stats.pro,
        free: stats.free,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket stats',
    });
  }
});

// Get connection count
router.get('/count', async (req, res) => {
  try {
    const count = getConnectedUsersCount();
    
    res.json({
      success: true,
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get connection count',
    });
  }
});

module.exports = router;