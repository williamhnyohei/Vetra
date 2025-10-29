/**
 * Authentication Routes
 * Handles user authentication and authorization
 */

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const { user } = req;
      
      // Check if user exists
      let dbUser = await db('users')
        .where({ email: user.email })
        .first();

      if (!dbUser) {
        // Create new user
        [dbUser] = await db('users')
          .insert({
            email: user.email,
            name: user.name,
            avatar_url: user.picture,
            provider: 'google',
            provider_id: user.id,
            is_verified: true,
            last_login_at: new Date(),
          })
          .returning('*');
      } else {
        // Update last login
        await db('users')
          .where({ id: dbUser.id })
          .update({ last_login_at: new Date() });
      }

      // Generate JWT tokens
      const accessToken = jwt.sign(
        { userId: dbUser.id, email: dbUser.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: dbUser.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
      );

      // Store refresh token in cache
      await cache.set(`refresh:${dbUser.id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

      res.json({
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          avatar: dbUser.avatar_url,
          provider: dbUser.provider,
          subscription_plan: dbUser.subscription_plan,
        },
        accessToken,
        refreshToken,
      });

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
);

// Google Extension login - validates Google token and creates user
router.post('/google/extension', [
  body('token').isString().notEmpty(),
  body('userInfo').isObject().optional(),
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

    const { token, userInfo } = req.body;

    // Validate token with Google
    let googleUser;
    try {
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!googleResponse.ok) {
        throw new Error('Invalid Google token');
      }

      googleUser = await googleResponse.json();
    } catch (error) {
      logger.error('Google token validation error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token',
      });
    }

    // Check if user exists
    let dbUser = await db('users')
      .where({ email: googleUser.email })
      .first();

    if (!dbUser) {
      // Create new user
      [dbUser] = await db('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google',
          provider_id: googleUser.id,
          is_verified: true,
          is_active: true,
          last_login_at: new Date(),
        })
        .returning('*');
      
      logger.info('New user created via Google extension', {
        userId: dbUser.id,
        email: dbUser.email,
      });
    } else {
      // Update last login
      await db('users')
        .where({ id: dbUser.id })
        .update({ 
          last_login_at: new Date(),
          avatar_url: googleUser.picture, // Update avatar in case it changed
        });
      
      logger.info('User logged in via Google extension', {
        userId: dbUser.id,
        email: dbUser.email,
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: dbUser.id, email: dbUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: dbUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Store refresh token in cache
    await cache.set(`refresh:${dbUser.id}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar_url,
        provider: dbUser.provider,
        subscription_plan: dbUser.subscription_plan,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    logger.error('Google extension login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

// Guest login
router.post('/guest', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
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

    const { name = 'Guest User' } = req.body;
    const guestEmail = `guest_${Date.now()}@vetra.com`;

    // Create guest user
    const [guestUser] = await db('users')
      .insert({
        email: guestEmail,
        name,
        provider: 'guest',
        is_active: true,
        last_login_at: new Date(),
      })
      .returning('*');

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: guestUser.id, email: guestUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: guestUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Store refresh token in cache
    await cache.set(`refresh:${guestUser.id}`, refreshToken, 30 * 24 * 60 * 60);

    res.json({
      success: true,
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        provider: guestUser.provider,
        subscription_plan: guestUser.subscription_plan,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    logger.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      error: 'Guest authentication failed',
    });
  }
});

// Refresh token
router.post('/refresh', [
  body('refreshToken').isString().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists in cache
    const cachedToken = await cache.get(`refresh:${decoded.userId}`);
    if (!cachedToken || cachedToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Get user data
    const user = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.user || {};
    
    if (userId) {
      // Remove refresh token from cache
      await cache.del(`refresh:${userId}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
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
        preferences: user.preferences,
        settings: user.settings,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
});

module.exports = router;
