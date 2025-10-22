/**
 * Validation Configuration
 * Request validation setup
 */

const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.logSecurity('Validation error', {
      errors: errors.array(),
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  
  next();
};

// Common validation rules
const commonRules = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  name: body('name').isLength({ min: 1, max: 100 }).trim(),
  uuid: param('id').isUUID(),
  page: query('page').optional().isInt({ min: 1 }).toInt(),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
};

// Transaction validation rules
const transactionRules = {
  analyze: [
    body('transactionData').isObject().notEmpty(),
    body('transactionData.signature').optional().isString(),
    body('transactionData.type').isString().isIn(['transfer', 'swap', 'approve', 'mint', 'burn', 'other']),
    body('transactionData.from').isString().isLength({ min: 32, max: 44 }),
    body('transactionData.to').isString().isLength({ min: 32, max: 44 }),
    body('transactionData.amount').isString().matches(/^\d+(\.\d+)?$/),
    body('transactionData.token').optional().isString(),
  ],
  updateStatus: [
    param('id').isUUID(),
    body('status').isIn(['approved', 'rejected']),
    body('feedback').optional().isString().isLength({ max: 500 }),
  ],
};

// Attestation validation rules
const attestationRules = {
  create: [
    body('transactionHash').isString().notEmpty(),
    body('riskScore').isInt({ min: 0, max: 100 }),
    body('riskLevel').isIn(['low', 'medium', 'high']),
    body('stakeAmount').isDecimal().custom((value) => {
      if (parseFloat(value) < 1) {
        throw new Error('Minimum stake amount is 1 SOL');
      }
      return true;
    }),
    body('evidence').optional().isObject(),
  ],
  vote: [
    param('id').isUUID(),
    body('vote').isIn(['approve', 'reject']),
    body('stakeAmount').isDecimal().custom((value) => {
      if (parseFloat(value) < 0.1) {
        throw new Error('Minimum vote stake is 0.1 SOL');
      }
      return true;
    }),
  ],
};

// User validation rules
const userRules = {
  updateProfile: [
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('avatar').optional().isURL(),
  ],
  updateSettings: [
    body('settings').optional().isObject(),
    body('preferences').optional().isObject(),
  ],
};

// Settings validation rules
const settingsRules = {
  update: [
    body('theme').optional().isIn(['light', 'dark', 'auto']),
    body('language').optional().isIn(['en', 'pt', 'es']),
    body('notifications').optional().isObject(),
    body('risk_threshold').optional().isInt({ min: 0, max: 100 }),
    body('auto_block_high_risk').optional().isBoolean(),
    body('show_attestations').optional().isBoolean(),
    body('rpc_endpoint').optional().isURL(),
    body('network').optional().isIn(['mainnet-beta', 'devnet', 'testnet']),
    body('ai_rigidity').optional().isInt({ min: 0, max: 100 }),
    body('ai_language').optional().isIn(['en', 'pt', 'es']),
    body('share_insights').optional().isBoolean(),
    body('transaction_memory').optional().isBoolean(),
    body('smart_contract_fingerprints').optional().isBoolean(),
  ],
  updateNotifications: [
    body('email').optional().isBoolean(),
    body('push').optional().isBoolean(),
    body('risk_alerts').optional().isBoolean(),
    body('attestation_updates').optional().isBoolean(),
  ],
};

// Auth validation rules
const authRules = {
  guest: [
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  ],
  refresh: [
    body('refreshToken').isString().notEmpty(),
  ],
};

// Export validation rules
module.exports = {
  handleValidationErrors,
  commonRules,
  transactionRules,
  attestationRules,
  userRules,
  settingsRules,
  authRules,
};
