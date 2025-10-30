/**
 * Risk Analysis Service
 * Analyzes Solana transactions for fraud detection
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const { getAccount } = require('@solana/spl-token');
const axios = require('axios');
const logger = require('../utils/logger');
const { analyzeTransactionWithMAS, getMASStatus } = require('./multiAgentSystemMock');

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

/**
 * Analyze transaction for risk factors
 * @param {Object} transactionData - Transaction data to analyze
 * @returns {Object} Risk analysis result
 */
async function analyzeTransaction(transactionData) {
  try {
    logger.info('🔍 Starting risk analysis');
    
    const {
      signature,
      type,
      from,
      to,
      amount,
      token,
    } = transactionData;

    // Check if we should use Multi-Agent System (MAS)
    const useMAS = process.env.USE_MULTI_AGENT_SYSTEM === 'true' || true; // Default to true for mock

    if (useMAS) {
      logger.info('🤖 Using Multi-Agent System for analysis');
      const masStatus = getMASStatus();
      logger.info('MAS Status:', masStatus);

      // Use MAS for analysis (currently mock)
      const masAnalysis = await analyzeTransactionWithMAS(transactionData);
      
      return {
        score: masAnalysis.score,
        level: masAnalysis.level,
        reasons: masAnalysis.reasons,
        heuristics: masAnalysis.heuristics,
        recommendations: masAnalysis.recommendations,
        confidence: masAnalysis.confidence,
        method: 'multi-agent-system',
        isMock: masAnalysis.isMock,
        agentAnalysis: masAnalysis.agentAnalysis,
      };
    }

    // Fallback to traditional heuristic analysis
    logger.info('📊 Using traditional heuristic analysis');
    const riskFactors = [];
    let riskScore = 0;

    // 1. Amount Analysis (20 points)
    const amountRisk = await analyzeAmount(amount, token);
    riskScore += amountRisk.score;
    if (amountRisk.reasons.length > 0) {
      riskFactors.push(...amountRisk.reasons);
    }

    // 2. Address Reputation (25 points)
    const addressRisk = await analyzeAddresses(from, to);
    riskScore += addressRisk.score;
    if (addressRisk.reasons.length > 0) {
      riskFactors.push(...addressRisk.reasons);
    }

    // 3. Token Analysis (20 points)
    const tokenRisk = await analyzeToken(token, amount);
    riskScore += tokenRisk.score;
    if (tokenRisk.reasons.length > 0) {
      riskFactors.push(...tokenRisk.reasons);
    }

    // 4. Transaction Type Analysis (15 points)
    const typeRisk = analyzeTransactionType(type, amount);
    riskScore += typeRisk.score;
    if (typeRisk.reasons.length > 0) {
      riskFactors.push(...typeRisk.reasons);
    }

    // 5. Network Analysis (10 points)
    const networkRisk = await analyzeNetwork(signature);
    riskScore += networkRisk.score;
    if (networkRisk.reasons.length > 0) {
      riskFactors.push(...networkRisk.reasons);
    }

    // 6. Time-based Analysis (10 points)
    const timeRisk = analyzeTimePatterns();
    riskScore += timeRisk.score;
    if (timeRisk.reasons.length > 0) {
      riskFactors.push(...timeRisk.reasons);
    }

    // Determine risk level
    let riskLevel;
    if (riskScore >= 70) {
      riskLevel = 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      score: Math.min(100, Math.max(0, riskScore)),
      level: riskLevel,
      reasons: riskFactors,
      heuristics: {
        amountAnalysis: amountRisk,
        addressAnalysis: addressRisk,
        tokenAnalysis: tokenRisk,
        typeAnalysis: typeRisk,
        networkAnalysis: networkRisk,
        timeAnalysis: timeRisk,
      },
    };

  } catch (error) {
    logger.error('Risk analysis error:', error);
    return {
      score: 50, // Default medium risk on error
      level: 'medium',
      reasons: ['Analysis failed - unable to determine risk'],
      heuristics: {},
    };
  }
}

/**
 * Analyze transaction amount for risk factors
 */
async function analyzeAmount(amount, token) {
  const reasons = [];
  let score = 0;

  try {
    const amountNum = parseFloat(amount);
    
    // Very high amount threshold
    if (amountNum > 1000000) { // 1M tokens
      score += 20;
      reasons.push('Extremely high transaction amount');
    }
    // High amount threshold
    else if (amountNum > 100000) { // 100K tokens
      score += 10;
      reasons.push('High transaction amount');
    }
    // Very low amount (potential dust attack)
    else if (amountNum < 0.000001) {
      score += 15;
      reasons.push('Very low amount - potential dust attack');
    }

    // Check against token market cap if available
    if (token) {
      const marketData = await getTokenMarketData(token);
      if (marketData) {
        const percentageOfSupply = (amountNum / marketData.totalSupply) * 100;
        if (percentageOfSupply > 10) {
          score += 15;
          reasons.push('Large percentage of token supply');
        }
      }
    }

  } catch (error) {
    logger.error('Amount analysis error:', error);
    score += 5;
    reasons.push('Unable to parse transaction amount');
  }

  return { score, reasons };
}

/**
 * Analyze addresses for reputation and risk factors
 */
async function analyzeAddresses(from, to) {
  const reasons = [];
  let score = 0;

  try {
    // Check if addresses are in known scam databases
    const fromReputation = await checkAddressReputation(from);
    const toReputation = await checkAddressReputation(to);

    if (fromReputation.isScam) {
      score += 20;
      reasons.push(`Source address flagged as scam: ${fromReputation.reason}`);
    }

    if (toReputation.isScam) {
      score += 25;
      reasons.push(`Destination address flagged as scam: ${toReputation.reason}`);
    }

    // Check for new addresses (low reputation)
    if (fromReputation.reputation < 30) {
      score += 5;
      reasons.push('Source address has low reputation');
    }

    if (toReputation.reputation < 30) {
      score += 8;
      reasons.push('Destination address has low reputation');
    }

    // Check for known exchange addresses
    if (toReputation.isExchange) {
      score -= 5; // Exchanges are generally safer
      reasons.push('Destination is a known exchange');
    }

  } catch (error) {
    logger.error('Address analysis error:', error);
    score += 5;
    reasons.push('Unable to verify address reputation');
  }

  return { score, reasons };
}

/**
 * Analyze token for risk factors
 */
async function analyzeToken(tokenAddress, amount) {
  const reasons = [];
  let score = 0;

  try {
    if (!tokenAddress) {
      return { score: 0, reasons: [] };
    }

    // Get token metadata
    const tokenData = await getTokenData(tokenAddress);
    
    if (!tokenData) {
      score += 10;
      reasons.push('Token metadata not found');
      return { score, reasons };
    }

    // Check token age
    const tokenAge = Date.now() - tokenData.createdAt;
    const daysOld = tokenAge / (1000 * 60 * 60 * 24);
    
    if (daysOld < 1) {
      score += 20;
      reasons.push('Token created less than 24 hours ago');
    } else if (daysOld < 7) {
      score += 10;
      reasons.push('Token created less than a week ago');
    }

    // Check liquidity
    if (tokenData.liquidity < 10000) { // Less than $10k liquidity
      score += 15;
      reasons.push('Low token liquidity');
    }

    // Check holder concentration
    if (tokenData.topHolderPercentage > 50) {
      score += 20;
      reasons.push('High holder concentration');
    }

    // Check if token is verified
    if (!tokenData.verified) {
      score += 5;
      reasons.push('Token not verified');
    }

  } catch (error) {
    logger.error('Token analysis error:', error);
    score += 5;
    reasons.push('Unable to analyze token');
  }

  return { score, reasons };
}

/**
 * Analyze transaction type for risk factors
 */
function analyzeTransactionType(type, amount) {
  const reasons = [];
  let score = 0;

  switch (type) {
    case 'approve':
      score += 15;
      reasons.push('Approve transactions can be dangerous');
      
      // Check for unlimited approval
      if (amount === '0' || amount === 'unlimited') {
        score += 20;
        reasons.push('Unlimited approval detected');
      }
      break;

    case 'swap':
      score += 5;
      reasons.push('Swap transactions involve price impact');
      break;

    case 'transfer':
      // Regular transfers are generally safer
      break;

    case 'mint':
      score += 10;
      reasons.push('Mint transactions can be risky');
      break;

    case 'burn':
      score += 5;
      reasons.push('Burn transactions are irreversible');
      break;

    default:
      score += 8;
      reasons.push('Unknown transaction type');
  }

  return { score, reasons };
}

/**
 * Analyze network conditions
 */
async function analyzeNetwork(signature) {
  const reasons = [];
  let score = 0;

  try {
    if (!signature) {
      return { score: 0, reasons: [] };
    }

    // Check transaction confirmation status
    const txStatus = await connection.getSignatureStatus(signature);
    
    if (!txStatus.value?.confirmationStatus) {
      score += 5;
      reasons.push('Transaction not confirmed');
    }

    // Check for recent network congestion
    const recentBlockhash = await connection.getRecentBlockhash();
    const slot = await connection.getSlot();
    
    // Simple congestion check (can be improved)
    if (recentBlockhash.contextSlot < slot - 10) {
      score += 3;
      reasons.push('Network congestion detected');
    }

  } catch (error) {
    logger.error('Network analysis error:', error);
    score += 2;
    reasons.push('Unable to verify network status');
  }

  return { score, reasons };
}

/**
 * Analyze time-based patterns
 */
function analyzeTimePatterns() {
  const reasons = [];
  let score = 0;

  const hour = new Date().getHours();
  
  // Unusual transaction times
  if (hour >= 2 && hour <= 6) {
    score += 3;
    reasons.push('Transaction during unusual hours');
  }

  // Weekend transactions might be riskier
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score += 2;
    reasons.push('Weekend transaction');
  }

  return { score, reasons };
}

/**
 * Check address reputation
 */
async function checkAddressReputation(address) {
  try {
    // This would integrate with external reputation services
    // For now, return mock data
    return {
      isScam: false,
      isExchange: false,
      reputation: 75,
      reason: null,
    };
  } catch (error) {
    logger.error('Address reputation check error:', error);
    return {
      isScam: false,
      isExchange: false,
      reputation: 50,
      reason: null,
    };
  }
}

/**
 * Get token data
 */
async function getTokenData(tokenAddress) {
  try {
    // This would integrate with token metadata services
    // For now, return mock data
    return {
      name: 'Token',
      symbol: 'TKN',
      decimals: 9,
      totalSupply: 1000000000,
      liquidity: 50000,
      topHolderPercentage: 30,
      verified: true,
      createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    };
  } catch (error) {
    logger.error('Token data fetch error:', error);
    return null;
  }
}

/**
 * Get token market data
 */
async function getTokenMarketData(tokenAddress) {
  try {
    // This would integrate with CoinGecko or similar APIs
    return {
      totalSupply: 1000000000,
      marketCap: 1000000,
      price: 0.001,
    };
  } catch (error) {
    logger.error('Token market data fetch error:', error);
    return null;
  }
}

module.exports = {
  analyzeTransaction,
};
