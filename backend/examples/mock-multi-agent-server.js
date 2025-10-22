/**
 * Mock Multi-Agent System Server
 * 
 * This is a simple mock server that simulates the Multi-Agent System API
 * for testing and development purposes.
 * 
 * To run: node examples/mock-multi-agent-server.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simulate analysis delay
const simulateDelay = (ms = 2000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { transaction, context, preferences } = req.body;

    // Validate input
    if (!transaction || !transaction.type || !transaction.from_address || !transaction.to_address || !transaction.amount) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [
          { field: 'transaction', message: 'Missing required transaction fields' }
        ]
      });
    }

    // Simulate processing time based on analysis depth
    const depth = preferences?.analysis_depth || 'standard';
    const delays = { quick: 500, standard: 2000, deep: 5000 };
    await simulateDelay(delays[depth] || 2000);

    // Calculate mock risk score based on transaction data
    let riskScore = 50;
    const riskFactors = [];

    // Amount analysis
    const amount = parseFloat(transaction.amount);
    if (amount > 100000) {
      riskScore += 20;
      riskFactors.push({
        factor: 'high_amount',
        severity: 'high',
        description: 'Transaction amount exceeds $100,000',
        weight: 0.25
      });
    } else if (amount > 10000) {
      riskScore += 10;
      riskFactors.push({
        factor: 'medium_amount',
        severity: 'medium',
        description: 'Transaction amount exceeds $10,000',
        weight: 0.15
      });
    }

    // Transaction type analysis
    if (transaction.type === 'approve') {
      riskScore += 15;
      riskFactors.push({
        factor: 'approval_transaction',
        severity: 'medium',
        description: 'Approval transactions can be risky',
        weight: 0.20
      });
    }

    // Token analysis (if new or unknown)
    if (!transaction.token_symbol || transaction.token_symbol === 'UNKNOWN') {
      riskScore += 10;
      riskFactors.push({
        factor: 'unknown_token',
        severity: 'medium',
        description: 'Token metadata not verified',
        weight: 0.15
      });
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

    // Generate mock response
    const response = {
      risk_assessment: {
        score: Math.min(100, riskScore),
        level: riskLevel,
        confidence: 0.85
      },
      agent_analysis: {
        token_agent: {
          score: Math.min(100, riskScore + Math.random() * 10 - 5),
          findings: [
            'Token analysis completed',
            transaction.token_symbol ? `Token: ${transaction.token_symbol}` : 'Token metadata not available',
            amount > 10000 ? 'High value transaction detected' : 'Normal value transaction'
          ],
          severity: riskLevel
        },
        address_agent: {
          score: Math.min(100, riskScore + Math.random() * 10 - 5),
          findings: [
            'Address reputation check completed',
            `From: ${transaction.from_address.substring(0, 8)}...`,
            `To: ${transaction.to_address.substring(0, 8)}...`,
            context?.user_reputation ? `User reputation: ${context.user_reputation}/1000` : 'No user reputation data'
          ],
          severity: riskLevel
        },
        pattern_agent: {
          score: Math.min(100, riskScore + Math.random() * 10 - 5),
          findings: [
            'Pattern analysis completed',
            `Transaction type: ${transaction.type}`,
            'No suspicious patterns detected'
          ],
          severity: 'low'
        },
        network_agent: {
          score: 30,
          findings: [
            'Network conditions normal',
            `Network: ${transaction.network || 'mainnet-beta'}`,
            'Gas fees within normal range'
          ],
          severity: 'low'
        },
        ml_agent: {
          score: Math.min(100, riskScore + Math.random() * 10 - 5),
          prediction: riskLevel === 'high' ? 'suspicious' : 'safe',
          confidence: 0.82
        }
      },
      risk_factors: riskFactors,
      recommendations: {
        action: riskLevel === 'high' ? 'block' : riskLevel === 'medium' ? 'review' : 'approve',
        reason: riskLevel === 'high'
          ? 'Multiple high-severity risk factors detected'
          : riskLevel === 'medium'
            ? 'Some risk factors present, review recommended'
            : 'Transaction appears safe to proceed',
        alternative_actions: riskLevel === 'high'
          ? ['Wait and re-analyze', 'Reduce amount', 'Contact support']
          : ['Proceed with caution', 'Set spending limit']
      },
      evidence: {
        on_chain_data: {
          token_metadata: {
            name: transaction.token_symbol || 'Unknown Token',
            symbol: transaction.token_symbol || 'UNK',
            decimals: 9,
            total_supply: '1000000000'
          },
          holder_distribution: {
            total_holders: Math.floor(Math.random() * 10000) + 100,
            top_10_percentage: Math.random() * 50 + 20
          }
        },
        historical_patterns: {
          similar_transactions: [],
          address_history: {
            total_transactions: context?.user_transaction_count || 0,
            incoming: Math.floor(Math.random() * 50),
            outgoing: Math.floor(Math.random() * 50)
          }
        },
        external_sources: [
          {
            source: 'MockDataProvider',
            data: { status: 'checked', risk: riskLevel }
          }
        ]
      },
      metadata: {
        analysis_duration_ms: delays[depth] || 2000,
        agents_used: ['token_agent', 'address_agent', 'pattern_agent', 'network_agent', 'ml_agent'],
        data_sources: ['solana_rpc', 'mock_provider'],
        timestamp: new Date().toISOString(),
        version: '1.0.0-mock'
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Mock analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/analyze/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0-mock',
    uptime: process.uptime(),
    agents: {
      token_agent: 'operational',
      address_agent: 'operational',
      pattern_agent: 'operational',
      network_agent: 'operational',
      ml_agent: 'operational'
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Mock Multi-Agent System',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      analyze: 'POST /api/analyze',
      health: 'GET /api/analyze/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Mock Multi-Agent System running on http://localhost:${PORT}`);
  console.log(`📊 Analyze endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/analyze/health`);
});

module.exports = app;

