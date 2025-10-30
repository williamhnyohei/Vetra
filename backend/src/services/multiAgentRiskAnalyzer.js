/**
 * Multi-Agent Risk Analyzer Service
 * Integrates with external Multi-Agent System for risk analysis
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

/**
 * ============================================================================
 * MULTI-AGENT SYSTEM API INTEGRATION
 * ============================================================================
 * 
 * This service integrates with an external Multi-Agent System that performs
 * advanced risk analysis using AI agents specialized in different aspects
 * of fraud detection.
 * 
 * CONFIGURATION:
 * - Set MULTI_AGENT_API_URL in .env
 * - Set MULTI_AGENT_API_KEY in .env (optional, for authentication)
 * 
 * ============================================================================
 */

// Multi-Agent System API Configuration
const MULTI_AGENT_CONFIG = {
  apiUrl: process.env.MULTI_AGENT_API_URL || 'http://localhost:5000/api/analyze',
  apiKey: process.env.MULTI_AGENT_API_KEY || '',
  timeout: parseInt(process.env.MULTI_AGENT_TIMEOUT) || 30000, // 30 seconds
  retries: parseInt(process.env.MULTI_AGENT_RETRIES) || 3,
  cacheEnabled: process.env.MULTI_AGENT_CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.MULTI_AGENT_CACHE_TTL) || 3600, // 1 hour
};

/**
 * ============================================================================
 * INPUT SCHEMA - Data sent to Multi-Agent System
 * ============================================================================
 */
const INPUT_SCHEMA = {
  // Transaction basic information
  transaction: {
    signature: 'string (optional)', // Solana transaction signature
    type: 'string (required)', // transfer, swap, approve, mint, burn, other
    from_address: 'string (required)', // Source wallet address
    to_address: 'string (required)', // Destination wallet address
    amount: 'string (required)', // Transaction amount
    token_address: 'string (optional)', // Token contract address
    token_symbol: 'string (optional)', // Token symbol (e.g., SOL, USDC)
    timestamp: 'number (optional)', // Unix timestamp
    network: 'string (optional)', // mainnet-beta, devnet, testnet
  },

  // Additional context for analysis
  context: {
    user_id: 'string (optional)', // User identifier
    user_reputation: 'number (optional)', // User reputation score (0-1000)
    user_transaction_count: 'number (optional)', // Number of previous transactions
    wallet_age_days: 'number (optional)', // Age of wallet in days
    previous_high_risk_count: 'number (optional)', // Previous high-risk transactions
  },

  // Analysis preferences
  preferences: {
    analysis_depth: 'string (optional)', // quick, standard, deep
    include_on_chain_data: 'boolean (optional)', // Whether to fetch on-chain data
    include_ml_prediction: 'boolean (optional)', // Whether to use ML models
    language: 'string (optional)', // en, pt, es
  },
};

/**
 * ============================================================================
 * OUTPUT SCHEMA - Data received from Multi-Agent System
 * ============================================================================
 */
const OUTPUT_SCHEMA = {
  // Risk assessment
  risk_assessment: {
    score: 'number (0-100)', // Overall risk score
    level: 'string', // low, medium, high
    confidence: 'number (0-1)', // Confidence in the assessment
  },

  // Detailed analysis by agent
  agent_analysis: {
    phishing_agent: {
      score: 'number (0-100)',
      findings: 'array of strings',
      severity: 'string', // low, medium, high
    },
    transaction_agent: {
      score: 'number (0-100)',
      findings: 'array of strings',
      severity: 'string',
    },
    rugpull_agent: {
      score: 'number (0-100)',
      findings: 'array of strings',
      severity: 'string',
    },
  },

  // Risk factors identified
  risk_factors: [
    {
      factor: 'string', // Factor name
      severity: 'string', // low, medium, high
      description: 'string', // Human-readable description
     // weight: 'number (0-1)', // Impact on final score
    },
  ],

  // Recommended actions
  recommendations: {
    action: 'string', // approve, review, block
    reason: 'string', // Explanation
    alternative_actions: 'array of strings', // Alternative suggestions
  },

  // Evidence collected
  evidence: {
    on_chain_data: 'object (optional)', // On-chain evidence
    historical_patterns: 'object (optional)', // Historical patterns
    external_sources: 'array (optional)', // External data sources used
  },

  // Metadata
  metadata: {
    analysis_duration_ms: 'number', // Time taken for analysis
    agents_used: 'array of strings', // Which agents participated
    data_sources: 'array of strings', // Data sources consulted
    timestamp: 'string (ISO 8601)', // Analysis timestamp
    version: 'string', // Multi-Agent System version
  },
};

/**
 * ============================================================================
 * MAIN ANALYSIS FUNCTION
 * ============================================================================
 */

/**
 * Analyze transaction using Multi-Agent System
 * @param {Object} transactionData - Transaction data to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Risk analysis result
 */
async function analyzeTransactionWithMultiAgent(transactionData, options = {}) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(transactionData);

    // Check cache if enabled
    if (MULTI_AGENT_CONFIG.cacheEnabled) {
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        logger.info('Multi-Agent analysis result from cache', { cacheKey });
        return {
          ...cachedResult,
          cached: true,
        };
      }
    }

    // Prepare input data
    const inputData = prepareInputData(transactionData, options);

    // Validate input data
    validateInputData(inputData);

    // Call Multi-Agent System API
    const analysisResult = await callMultiAgentAPI(inputData);

    // Validate output data
    validateOutputData(analysisResult);

    // Process and normalize result
    const normalizedResult = normalizeAnalysisResult(analysisResult);

    // Cache result if enabled
    if (MULTI_AGENT_CONFIG.cacheEnabled) {
      await cache.set(cacheKey, normalizedResult, MULTI_AGENT_CONFIG.cacheTTL);
    }

    // Log analysis
    logger.logRiskAnalysis(
      transactionData.signature || 'unknown',
      normalizedResult.risk_assessment.score,
      normalizedResult.risk_factors
    );

    return {
      ...normalizedResult,
      cached: false,
    };

  } catch (error) {
    logger.error('Multi-Agent analysis error:', error);
    
    // Fallback to basic analysis if Multi-Agent System fails
    logger.warn('Falling back to basic risk analysis');
    return fallbackAnalysis(transactionData);
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Generate cache key for transaction
 */
function generateCacheKey(transactionData) {
  const { signature, from_address, to_address, amount, token_address } = transactionData;
  const key = `multi-agent:${signature || `${from_address}-${to_address}-${amount}-${token_address}`}`;
  return key;
}

/**
 * Prepare input data for Multi-Agent System
 */
function prepareInputData(transactionData, options = {}) {
  return {
    transaction: {
      signature: transactionData.signature,
      type: transactionData.type,
      from_address: transactionData.from,
      to_address: transactionData.to,
      amount: transactionData.amount,
      token_address: transactionData.token,
      token_symbol: transactionData.tokenSymbol,
      timestamp: transactionData.timestamp || Date.now(),
      network: transactionData.network || 'mainnet-beta',
    },
    context: {
      user_id: options.userId,
      user_reputation: options.userReputation,
      user_transaction_count: options.userTransactionCount,
      wallet_age_days: options.walletAgeDays,
      previous_high_risk_count: options.previousHighRiskCount,
    },
    preferences: {
      analysis_depth: options.analysisDepth || 'standard',
      include_on_chain_data: options.includeOnChainData !== false,
      include_ml_prediction: options.includeMlPrediction !== false,
      language: options.language || 'en',
    },
  };
}

/**
 * Validate input data
 */
function validateInputData(inputData) {
  const { transaction } = inputData;

  if (!transaction.type) {
    throw new Error('Transaction type is required');
  }

  if (!transaction.from_address) {
    throw new Error('Source address is required');
  }

  if (!transaction.to_address) {
    throw new Error('Destination address is required');
  }

  if (!transaction.amount) {
    throw new Error('Transaction amount is required');
  }

  const validTypes = ['transfer', 'swap', 'approve', 'mint', 'burn', 'other'];
  if (!validTypes.includes(transaction.type)) {
    throw new Error(`Invalid transaction type: ${transaction.type}`);
  }
}

/**
 * Call Multi-Agent System API with retry logic
 */
async function callMultiAgentAPI(inputData, retryCount = 0) {
  try {
    const startTime = Date.now();

    logger.info('Calling Multi-Agent System API', {
      url: MULTI_AGENT_CONFIG.apiUrl,
      retry: retryCount,
    });

    const response = await axios.post(
      MULTI_AGENT_CONFIG.apiUrl,
      inputData,
      {
        timeout: MULTI_AGENT_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': MULTI_AGENT_CONFIG.apiKey,
          'User-Agent': 'Vetra-Backend/1.0',
        },
      }
    );

    const duration = Date.now() - startTime;

    logger.logPerformance('Multi-Agent API call', duration, {
      status: response.status,
      retry: retryCount,
    });

    return response.data;

  } catch (error) {
    logger.error('Multi-Agent API call failed', {
      error: error.message,
      retry: retryCount,
      maxRetries: MULTI_AGENT_CONFIG.retries,
    });

    // Retry logic
    if (retryCount < MULTI_AGENT_CONFIG.retries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      logger.info(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callMultiAgentAPI(inputData, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Validate output data from Multi-Agent System
 */
function validateOutputData(outputData) {
  if (!outputData.risk_assessment) {
    throw new Error('Missing risk_assessment in response');
  }

  if (typeof outputData.risk_assessment.score !== 'number') {
    throw new Error('Invalid risk score');
  }

  if (outputData.risk_assessment.score < 0 || outputData.risk_assessment.score > 100) {
    throw new Error('Risk score must be between 0 and 100');
  }

  const validLevels = ['low', 'medium', 'high'];
  if (!validLevels.includes(outputData.risk_assessment.level)) {
    throw new Error('Invalid risk level');
  }
}

/**
 * Normalize analysis result to internal format
 */
function normalizeAnalysisResult(analysisResult) {
  return {
    // Main risk assessment
    score: Math.round(analysisResult.risk_assessment.score),
    level: analysisResult.risk_assessment.level,
    confidence: analysisResult.risk_assessment.confidence || 0.8,

    // Risk factors for display
    reasons: (analysisResult.risk_factors || []).map(factor => factor.description),

    // Detailed agent analysis
    agent_analysis: analysisResult.agent_analysis || {},

    // Risk factors with weights
    risk_factors: analysisResult.risk_factors || [],

    // Recommendations
    recommendations: analysisResult.recommendations || {
      action: analysisResult.risk_assessment.level === 'high' ? 'block' : 'approve',
      reason: 'Based on risk assessment',
      alternative_actions: [],
    },

    // Evidence
    evidence: analysisResult.evidence || {},

    // Metadata
    metadata: {
      ...analysisResult.metadata,
      source: 'multi-agent-system',
      timestamp: new Date().toISOString(),
    },

    // Legacy format for backward compatibility
    heuristics: {
      multi_agent_analysis: true,
      agents_used: analysisResult.metadata?.agents_used || [],
      analysis_duration: analysisResult.metadata?.analysis_duration_ms || 0,
    },
  };
}

/**
 * Fallback analysis when Multi-Agent System is unavailable
 */
function fallbackAnalysis(transactionData) {
  logger.warn('Using fallback risk analysis');

  // Basic heuristic-based analysis
  let score = 50; // Start with medium risk
  const reasons = [];

  // Check transaction amount
  const amount = parseFloat(transactionData.amount);
  if (amount > 1000000) {
    score += 20;
    reasons.push('Extremely high transaction amount');
  } else if (amount > 100000) {
    score += 10;
    reasons.push('High transaction amount');
  }

  // Check transaction type
  if (transactionData.type === 'approve') {
    score += 15;
    reasons.push('Approval transactions can be risky');
  }

  // Determine level
  let level;
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  if (reasons.length === 0) {
    reasons.push('Basic heuristic analysis performed');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    level,
    confidence: 0.5, // Lower confidence for fallback
    reasons,
    agent_analysis: {},
    risk_factors: [],
    recommendations: {
      action: level === 'high' ? 'review' : 'approve',
      reason: 'Fallback analysis - Multi-Agent System unavailable',
      alternative_actions: ['Wait for Multi-Agent System', 'Manual review'],
    },
    evidence: {},
    metadata: {
      source: 'fallback-analysis',
      timestamp: new Date().toISOString(),
      warning: 'Multi-Agent System unavailable',
    },
    heuristics: {
      multi_agent_analysis: false,
      fallback: true,
    },
  };
}

/**
 * ============================================================================
 * HEALTH CHECK
 * ============================================================================
 */

/**
 * Check if Multi-Agent System is available
 */
async function checkMultiAgentHealth() {
  try {
    const response = await axios.get(
      `${MULTI_AGENT_CONFIG.apiUrl}/health`,
      {
        timeout: 5000,
        headers: {
          'X-API-Key': MULTI_AGENT_CONFIG.apiKey,
        },
      }
    );

    return {
      available: true,
      status: response.status,
      data: response.data,
    };

  } catch (error) {
    logger.error('Multi-Agent System health check failed:', error.message);
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
  analyzeTransactionWithMultiAgent,
  checkMultiAgentHealth,
  MULTI_AGENT_CONFIG,
  INPUT_SCHEMA,
  OUTPUT_SCHEMA,
};

