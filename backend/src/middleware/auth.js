/**
 * Authentication Middleware
 * JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account deactivated',
      });
    }

    // Add user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      subscription_plan: user.subscription_plan,
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users')
      .where({ id: decoded.userId })
      .first();

    if (user && user.is_active) {
      req.user = {
        userId: user.id,
        email: user.email,
        subscription_plan: user.subscription_plan,
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // Ignore token errors for optional auth
    req.user = null;
    next();
  }
};

/**
 * Check if user has Pro subscription
 */
const requirePro = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (req.user.subscription_plan !== 'pro') {
    return res.status(403).json({
      success: false,
      error: 'Pro subscription required',
      upgrade_required: true,
    });
  }

  next();
};

/**
 * Rate limiting per user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    try {
      const { cache } = require('../config/redis');
      const key = `rate_limit:user:${req.user.userId}`;
      
      const current = await cache.incrementRateLimit(key, Math.floor(windowMs / 1000));
      
      if (current > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retry_after: Math.ceil(windowMs / 1000),
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString(),
      });

      next();

    } catch (error) {
      logger.error('Rate limiting error:', error);
      next(); // Continue on rate limit errors
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePro,
  userRateLimit,
};
