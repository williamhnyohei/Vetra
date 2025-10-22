/**
 * Redis Configuration
 * Cache and session management
 */

const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
};

async function connectRedis() {
  try {
    redisClient = redis.createClient(redisConfig);
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    throw error;
  }
}

// Cache helper functions
const cache = {
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  async exists(key) {
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
