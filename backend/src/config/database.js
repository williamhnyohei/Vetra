/**
 * Database Configuration
 * PostgreSQL connection setup with Knex.js
 */

const knex = require('knex');
const logger = require('../utils/logger');

const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'vetra_db',
    user: process.env.DB_USER || 'vetra_user',
    password: process.env.DB_PASSWORD || 'vetra_password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

const db = knex(dbConfig);

// Test database connection
async function connectDatabase() {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connection established');
    return db;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Graceful shutdown
async function closeDatabase() {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

module.exports = {
  db,
  connectDatabase,
  closeDatabase,
};
