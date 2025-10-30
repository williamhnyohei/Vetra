/**
 * Settings Routes
 * Handles application settings and preferences
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Get application settings
router.get('/', async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Default settings
    const defaultSettings = {
      theme: 'dark',
      language: 'en',
      soundAlerts: true,
      notifications: {
        email: true,
        push: true,
        risk_alerts: true,
        attestation_updates: true,
      },
      risk_threshold: 50,
      auto_block_high_risk: false,
      show_attestations: true,
      rpc_endpoint: 'https://api.mainnet-beta.solana.com',
      network: 'mainnet-beta',
      aiRigidity: 50,
      ai_rigidity: 50,
      aiLanguage: 'en',
      ai_language: 'en',
      shareInsights: false,
      share_insights: false,
      transactionMemory: true,
      transaction_memory: true,
      smartContractFingerprints: true,
      smart_contract_fingerprints: true,
    };

    const userSettings = user.settings || {};
    const mergedSettings = { ...defaultSettings, ...userSettings };

    res.json({
      success: true,
      settings: mergedSettings,
    });

  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
});

// Update application settings
router.patch('/', [
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('language').optional().isIn(['en', 'pt', 'es']),
  body('soundAlerts').optional().isBoolean(),
  body('notifications').optional().isObject(),
  body('risk_threshold').optional().isInt({ min: 0, max: 100 }),
  body('auto_block_high_risk').optional().isBoolean(),
  body('show_attestations').optional().isBoolean(),
  body('rpc_endpoint').optional().isURL(),
  body('network').optional().isIn(['mainnet-beta', 'devnet', 'testnet']),
  body('aiRigidity').optional().isInt({ min: 0, max: 100 }),
  body('ai_rigidity').optional().isInt({ min: 0, max: 100 }),
  body('aiLanguage').optional().isIn(['en', 'pt', 'es']),
  body('ai_language').optional().isIn(['en', 'pt', 'es']),
  body('shareInsights').optional().isBoolean(),
  body('share_insights').optional().isBoolean(),
  body('transactionMemory').optional().isBoolean(),
  body('transaction_memory').optional().isBoolean(),
  body('smartContractFingerprints').optional().isBoolean(),
  body('smart_contract_fingerprints').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { userId } = req.user;
    const settings = req.body;

    // Get current settings
    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Merge with existing settings
    const currentSettings = user.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    // Update settings in database
    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update({
        settings: updatedSettings,
        updated_at: new Date(),
      })
      .returning('*');

    // Clear user cache
    await cache.del(`user:${userId}`);

    res.json({
      success: true,
      settings: updatedSettings,
    });

  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
});

// Reset settings to default
router.post('/reset', async (req, res) => {
  try {
    const { userId } = req.user;

    const defaultSettings = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        risk_alerts: true,
        attestation_updates: true,
      },
      risk_threshold: 50,
      auto_block_high_risk: false,
      show_attestations: true,
      rpc_endpoint: 'https://api.mainnet-beta.solana.com',
      network: 'mainnet-beta',
      ai_rigidity: 50,
      ai_language: 'en',
      share_insights: false,
      transaction_memory: true,
      smart_contract_fingerprints: true,
    };

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update({
        settings: defaultSettings,
        updated_at: new Date(),
      })
      .returning('*');

    // Clear user cache
    await cache.del(`user:${userId}`);

    res.json({
      success: true,
      settings: defaultSettings,
    });

  } catch (error) {
    logger.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings',
    });
  }
});

// Get notification preferences
router.get('/notifications', async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const defaultNotifications = {
      email: true,
      push: true,
      risk_alerts: true,
      attestation_updates: true,
    };

    const userNotifications = user.settings?.notifications || {};
    const mergedNotifications = { ...defaultNotifications, ...userNotifications };

    res.json({
      success: true,
      notifications: mergedNotifications,
    });

  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences',
    });
  }
});

// Update notification preferences
router.patch('/notifications', [
  body('email').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('risk_alerts').optional().isBoolean(),
  body('attestation_updates').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { userId } = req.user;
    const notificationSettings = req.body;

    // Get current settings
    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update notification settings
    const currentSettings = user.settings || {};
    const currentNotifications = currentSettings.notifications || {};
    const updatedNotifications = { ...currentNotifications, ...notificationSettings };

    const updatedSettings = {
      ...currentSettings,
      notifications: updatedNotifications,
    };

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update({
        settings: updatedSettings,
        updated_at: new Date(),
      })
      .returning('*');

    // Clear user cache
    await cache.del(`user:${userId}`);

    res.json({
      success: true,
      notifications: updatedNotifications,
    });

  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
    });
  }
});

// Get available languages
router.get('/languages', async (req, res) => {
  try {
    const languages = [
      { code: 'en', name: 'English', native: 'English' },
      { code: 'pt', name: 'Portuguese', native: 'Português' },
      { code: 'es', name: 'Spanish', native: 'Español' },
    ];

    res.json({
      success: true,
      languages,
    });

  } catch (error) {
    logger.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get languages',
    });
  }
});

// Get available themes
router.get('/themes', async (req, res) => {
  try {
    const themes = [
      { code: 'light', name: 'Light', description: 'Light theme' },
      { code: 'dark', name: 'Dark', description: 'Dark theme' },
      { code: 'auto', name: 'Auto', description: 'Follow system preference' },
    ];

    res.json({
      success: true,
      themes,
    });

  } catch (error) {
    logger.error('Get themes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get themes',
    });
  }
});

module.exports = router;
