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
    logger.error('Multi-Agent analysis error', {
      message: error.message,
      code: error.code,
    });

    // Fallback to basic analysis if Multi-Agent System fails
    logger.warn('Falling back to basic risk analysis');
    return await fallbackAnalysis(transactionData);
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
    throw new Error('Risk score must be between 0 and 100 (or 0–1 from MAS)');
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
  let score = Number(analysisResult.risk_assessment.score);
  // MAS returns 0–1; backend UI uses 0–100
  if (score <= 1) score = Math.round(score * 100);
  else score = Math.round(score);

  const level =
    analysisResult.risk_assessment.level ||
    (score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low');

  return {
    // Main risk assessment
    score,
    level,
    confidence: analysisResult.risk_assessment.confidence || 0.8,

    // Risk factors for display
    reasons: (analysisResult.risk_factors || []).map((factor) =>
      typeof factor === 'string' ? factor : factor.description || factor.factor || String(factor)
    ),

    // Detailed agent analysis
    agent_analysis: analysisResult.agent_analysis || {},

    // Risk factors with weights
    risk_factors: analysisResult.risk_factors || [],

    // Recommendations
    recommendations: analysisResult.recommendations || {
      action: level === 'high' ? 'block' : 'approve',
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
 * Uses Solana RPC when possible for lightweight on-chain signals.
 */
async function fallbackAnalysis(transactionData) {
  logger.warn('Using fallback risk analysis');

  let score = 20;
  const reasons = [];
  const scoreBreakdown = [
    { factor: 'baseline', points: 20, detail: 'Fallback baseline (MAS offline)' },
  ];

  const amount = parseFloat(transactionData.amount);
  if (Number.isFinite(amount) && amount > 0) {
    // amount may be SOL (display) or still lamports — normalize
    const sol = amount >= 1000 ? amount / 1e9 : amount;
    if (sol > 100) {
      score += 25;
      reasons.push('Very high transaction amount');
      scoreBreakdown.push({ factor: 'amount', points: 25, detail: `${sol} SOL` });
    } else if (sol > 10) {
      score += 15;
      reasons.push('High transaction amount');
      scoreBreakdown.push({ factor: 'amount', points: 15, detail: `${sol} SOL` });
    } else if (sol > 1) {
      score += 5;
      scoreBreakdown.push({ factor: 'amount', points: 5, detail: `${sol} SOL` });
    }
  }

  const type = String(transactionData.type || '').toLowerCase();
  if (type === 'approve' || type.includes('approve')) {
    score += 30;
    reasons.push('Approval / allowance style transaction');
    scoreBreakdown.push({ factor: 'approve', points: 30, detail: 'Allowance-style tx' });
  }
  if (type === 'unknown' || type === 'rpc_send') {
    score += 10;
    reasons.push('Limited transaction metadata available');
    scoreBreakdown.push({ factor: 'limited_metadata', points: 10 });
  }

  if (!transactionData.to || transactionData.to === 'Unknown') {
    score += 8;
    reasons.push('Destination address unknown');
    scoreBreakdown.push({ factor: 'unknown_destination', points: 8 });
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  try {
    if (transactionData.to && transactionData.to !== 'Unknown' && transactionData.to.length >= 32) {
      const axios = require('axios');
      const resp = await axios.post(
        rpcUrl,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [transactionData.to, { encoding: 'base64' }],
        },
        { timeout: 4000 }
      );
      const value = resp?.data?.result?.value;
      if (value === null) {
        score += 12;
        reasons.push('Destination account has no on-chain history (unfunded)');
        scoreBreakdown.push({
          factor: 'unfunded_destination',
          points: 12,
          detail: 'Destination has no on-chain history',
        });
      }
    }
  } catch (e) {
    logger.warn('Fallback RPC enrichment failed:', e.message);
  }

  const programs = transactionData.programs || transactionData.instructions || [];
  if (Array.isArray(programs) && programs.length > 8) {
    score += 8;
    reasons.push('Unusually many instructions/programs');
    scoreBreakdown.push({ factor: 'many_instructions', points: 8 });
  }

  score = Math.min(100, Math.max(0, score));

  let level;
  if (score >= 70) level = 'high';
  else if (score >= 40) level = 'medium';
  else level = 'low';

  if (reasons.length === 0) {
    reasons.push('Basic heuristic analysis performed (MAS unavailable)');
  }

  return {
    score,
    level,
    confidence: 0.55,
    reasons,
    scoreBreakdown,
    agent_analysis: {},
    risk_factors: reasons.map((r) => ({
      factor: r,
      severity: level,
      description: r,
    })),
    recommendations: {
      action: level === 'high' ? 'block' : level === 'medium' ? 'review' : 'approve',
      reason: 'Fallback analysis - Multi-Agent System unavailable',
      alternative_actions: ['Retry with MAS online', 'Manual review'],
    },
    evidence: {
      source: 'fallback-heuristics+rpc',
    },
    metadata: {
      source: 'fallback',
      timestamp: new Date().toISOString(),
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
    // apiUrl is the full analyze endpoint; derive health URL
    const analyzeUrl = MULTI_AGENT_CONFIG.apiUrl;
    const healthUrl = analyzeUrl.replace(/\/api\/analyze\/?$/, '/api/health');

    const response = await axios.get(healthUrl, {
      timeout: 5000,
      headers: {
        'X-API-Key': MULTI_AGENT_CONFIG.apiKey,
      },
    });

    return {
      available: true,
      status: response.status,
      data: response.data,
      url: healthUrl,
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

