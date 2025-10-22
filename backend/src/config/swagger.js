/**
 * Swagger Configuration
 * API documentation setup
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vetra API',
      version: '1.0.0',
      description: 'Vetra Backend API for crypto transaction risk analysis',
      contact: {
        name: 'Vetra Team',
        email: 'support@vetra.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.vetra.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            provider: { type: 'string', enum: ['google', 'guest'] },
            subscription_plan: { type: 'string', enum: ['free', 'pro'] },
            created_at: { type: 'string', format: 'date-time' },
            last_login_at: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            signature: { type: 'string' },
            type: { type: 'string', enum: ['transfer', 'swap', 'approve', 'mint', 'burn', 'other'] },
            from_address: { type: 'string' },
            to_address: { type: 'string' },
            amount: { type: 'string' },
            token_address: { type: 'string' },
            risk_score: { type: 'integer', minimum: 0, maximum: 100 },
            risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
            risk_reasons: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'completed'] },
            analyzed_at: { type: 'string', format: 'date-time' },
          },
        },
        Attestation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            provider_pubkey: { type: 'string' },
            transaction_hash: { type: 'string' },
            risk_score: { type: 'integer', minimum: 0, maximum: 100 },
            risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
            stake_amount: { type: 'number' },
            reputation: { type: 'integer', minimum: 0, maximum: 1000 },
            verified: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        RiskAnalysis: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 100 },
            level: { type: 'string', enum: ['low', 'medium', 'high'] },
            reasons: { type: 'array', items: { type: 'string' } },
            heuristics: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
};
