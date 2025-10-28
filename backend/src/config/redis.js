/**
 * Redis Configuration
 * Cache and session management
 */

const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

// Configure Redis based on environment
const redisConfig = process.env.REDIS_URL ? 
  { url: process.env.REDIS_URL } : 
  {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
  };

async function connectRedis() {
  // Skip if no Redis URL configured
  if (!process.env.REDIS_URL) {
    console.log('ℹ️ REDIS_URL not configured, skipping Redis (cache disabled)');
    redisClient = null;
    return null;
  }

  try {
    console.log('🔧 Connecting to Redis...');
    
    redisClient = redis.createClient(redisConfig);
    
    // Suppress error logs - they're handled in catch
    redisClient.on('error', (err) => {
      // Silently handle errors
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      logger.info('Redis ready');
    });

    // Connect with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    
    console.log('✅ Redis connection successful');
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis unavailable, continuing without cache');
    logger.warn('Redis connection failed:', error.message);
    
    // Close client if it was created
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        // Ignore quit errors
      }
    }
    
    redisClient = null;
    return null;
  }
}

// Cache helper functions (gracefully handle when Redis is not available)
const cache = {
  async get(key) {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return false;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  async exists(key) {
    if (!redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Session management
  async setSession(sessionId, data, ttl = 86400) { // 24 hours
    return this.set(`session:${sessionId}`, data, ttl);
  },

  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  },

  async deleteSession(sessionId) {
    return this.del(`session:${sessionId}`);
  },

  // Rate limiting
  async incrementRateLimit(key, window = 900) { // 15 minutes
    if (!redisClient) return 0;
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      return current;
    } catch (error) {
      logger.error('Rate limit increment error:', error);
      return 0;
    }
  },

  // Risk analysis cache
  async cacheRiskAnalysis(transactionHash, analysis, ttl = 3600) {
    return this.set(`risk:${transactionHash}`, analysis, ttl);
  },

  async getCachedRiskAnalysis(transactionHash) {
    return this.get(`risk:${transactionHash}`);
  },
};

module.exports = {
  redisClient,
  connectRedis,
  cache,
};
