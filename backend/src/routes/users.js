/**
 * User Routes
 * Handles user profile and settings
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
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

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        provider: user.provider,
        subscription_plan: user.subscription_plan,
        subscription_expires_at: user.subscription_expires_at,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
});

// Update user profile
router.patch('/profile', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('avatar').optional().isURL(),
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
    const { name, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar_url = avatar;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar_url,
        provider: updatedUser.provider,
        subscription_plan: updatedUser.subscription_plan,
        updated_at: updatedUser.updated_at,
      },
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
});

// Get user settings
router.get('/settings', async (req, res) => {
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

    res.json({
      success: true,
      settings: user.settings || {},
    });

  } catch (error) {
    logger.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings',
    });
  }
});

// Update user settings
router.patch('/settings', [
  body('settings').optional().isObject(),
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
    const { settings } = req.body;

    const updateData = {};
    if (settings) updateData.settings = settings;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update(updateData)
      .returning('*');

    res.json({
      success: true,
      settings: updatedUser.settings,
    });

  } catch (error) {
    logger.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.user;

    // Get transaction statistics
    const transactionStats = await db('transactions')
      .where({ user_id: userId })
      .select([
        db.raw('COUNT(*) as total_transactions'),
        db.raw('AVG(risk_score) as avg_risk_score'),
        db.raw('COUNT(CASE WHEN risk_level = \'high\' THEN 1 END) as high_risk_count'),
        db.raw('COUNT(CASE WHEN risk_level = \'medium\' THEN 1 END) as medium_risk_count'),
        db.raw('COUNT(CASE WHEN risk_level = \'low\' THEN 1 END) as low_risk_count'),
        db.raw('COUNT(CASE WHEN status = \'approved\' THEN 1 END) as approved_count'),
        db.raw('COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected_count'),
      ])
      .first();

    // Get recent activity
    const recentTransactions = await db('transactions')
      .where({ user_id: userId })
      .orderBy('analyzed_at', 'desc')
      .limit(5)
      .select([
        'id',
        'type',
        'amount',
        'risk_score',
        'risk_level',
        'status',
        'analyzed_at',
      ]);

    // Get subscription info
    const user = await db('users')
      .where({ id: userId })
      .select(['subscription_plan', 'subscription_expires_at', 'created_at'])
      .first();

    res.json({
      success: true,
      stats: {
        transactions: transactionStats,
        recent_activity: recentTransactions,
        subscription: {
          plan: user.subscription_plan,
          expires_at: user.subscription_expires_at,
          member_since: user.created_at,
        },
      },
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
    });
  }
});

// Delete user account
router.delete('/account', [
  body('confirmation').equals('DELETE'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required',
      });
    }

    const { userId } = req.user;

    // Delete user and all related data
    await db.transaction(async (trx) => {
      // Delete transactions
      await trx('transactions').where({ user_id: userId }).del();
      
      // Delete user
      await trx('users').where({ id: userId }).del();
    });

    // Clear user cache
    await cache.del(`user:${userId}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    logger.error('Delete user account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
});

module.exports = router;
