# 🤖 Multi-Agent System API Specification

## Overview

Este documento descreve a especificação completa da API do Sistema Multi-Agente para análise de risco de transações Solana.

---

## 🔗 Endpoint

```
POST /api/analyze
```

---

## 🔐 Authentication

```http
X-API-Key: your-api-key-here
```

---

## 📥 Input Schema

### Request Body

```json
{
  "transaction": {
    "signature": "optional string - Solana transaction signature",
    "type": "required string - transfer|swap|approve|mint|burn|other",
    "from_address": "required string - Source wallet address (32-44 chars)",
    "to_address": "required string - Destination wallet address (32-44 chars)",
    "amount": "required string - Transaction amount (decimal format)",
    "token_address": "optional string - Token contract address",
    "token_symbol": "optional string - Token symbol (e.g., SOL, USDC)",
    "timestamp": "optional number - Unix timestamp in milliseconds",
    "network": "optional string - mainnet-beta|devnet|testnet (default: mainnet-beta)"
  },
  "context": {
    "user_id": "optional string - User identifier",
    "user_reputation": "optional number - User reputation score (0-1000)",
    "user_transaction_count": "optional number - Number of previous transactions",
    "wallet_age_days": "optional number - Age of wallet in days",
    "previous_high_risk_count": "optional number - Count of previous high-risk transactions"
  },
  "preferences": {
    "analysis_depth": "optional string - quick|standard|deep (default: standard)",
    "include_on_chain_data": "optional boolean - Whether to fetch on-chain data (default: true)",
    "include_ml_prediction": "optional boolean - Whether to use ML models (default: true)",
    "language": "optional string - en|pt|es (default: en)"
  }
}
```

### Example Request

```json
{
  "transaction": {
    "signature": "5j7s1QzqZqKqX9vXqKqX9vXqKqX9vXqKqX9vXqKqX9vXqKqX9vXqKqX9vXqKqX9v",
    "type": "transfer",
    "from_address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "to_address": "4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy",
    "amount": "1.5",
    "token_address": "So11111111111111111111111111111111111111112",
    "token_symbol": "SOL",
    "timestamp": 1704067200000,
    "network": "mainnet-beta"
  },
  "context": {
    "user_id": "user-123",
    "user_reputation": 850,
    "user_transaction_count": 45,
    "wallet_age_days": 180,
    "previous_high_risk_count": 2
  },
  "preferences": {
    "analysis_depth": "deep",
    "include_on_chain_data": true,
    "include_ml_prediction": true,
    "language": "en"
  }
}
```

---

## 📤 Output Schema

### Response Body

```json
{
  "risk_assessment": {
    "score": "number (0-100) - Overall risk score",
    "level": "string - low|medium|high",
    "confidence": "number (0-1) - Confidence in the assessment"
  },
  "agent_analysis": {
    "token_agent": {
      "score": "number (0-100) - Token-specific risk score",
      "findings": ["array of strings - Findings from token analysis"],
      "severity": "string - low|medium|high"
    },
    "address_agent": {
      "score": "number (0-100) - Address-specific risk score",
      "findings": ["array of strings - Findings from address analysis"],
      "severity": "string - low|medium|high"
    },
    "pattern_agent": {
      "score": "number (0-100) - Pattern-based risk score",
      "findings": ["array of strings - Findings from pattern analysis"],
      "severity": "string - low|medium|high"
    },
    "network_agent": {
      "score": "number (0-100) - Network-based risk score",
      "findings": ["array of strings - Findings from network analysis"],
      "severity": "string - low|medium|high"
    },
    "ml_agent": {
      "score": "number (0-100) - ML model risk score",
      "prediction": "string - Model prediction (fraud|safe|suspicious)",
      "confidence": "number (0-1) - Model confidence"
    }
  },
  "risk_factors": [
    {
      "factor": "string - Factor name (e.g., 'new_token')",
      "severity": "string - low|medium|high",
      "description": "string - Human-readable description",
      "weight": "number (0-1) - Impact on final score"
    }
  ],
  "recommendations": {
    "action": "string - approve|review|block",
    "reason": "string - Explanation for the recommendation",
    "alternative_actions": ["array of strings - Alternative suggestions"]
  },
  "evidence": {
    "on_chain_data": {
      "token_metadata": "object - Token metadata",
      "holder_distribution": "object - Token holder distribution",
      "liquidity_pools": "array - Liquidity pool information"
    },
    "historical_patterns": {
      "similar_transactions": "array - Similar past transactions",
      "address_history": "object - Address transaction history"
    },
    "external_sources": [
      {
        "source": "string - Source name",
        "data": "object - Data from source"
      }
    ]
  },
  "metadata": {
    "analysis_duration_ms": "number - Time taken for analysis",
    "agents_used": ["array of strings - Which agents participated"],
    "data_sources": ["array of strings - Data sources consulted"],
    "timestamp": "string (ISO 8601) - Analysis timestamp",
    "version": "string - Multi-Agent System version"
  }
}
```

### Example Response

```json
{
  "risk_assessment": {
    "score": 85,
    "level": "high",
    "confidence": 0.92
  },
  "agent_analysis": {
    "token_agent": {
      "score": 90,
      "findings": [
        "Token created less than 24 hours ago",
        "Low liquidity detected ($5,432)",
        "High holder concentration (top 10 holders own 78%)"
      ],
      "severity": "high"
    },
    "address_agent": {
      "score": 75,
      "findings": [
        "Destination address flagged in 3 previous scam reports",
        "Address created 2 days ago",
        "Low transaction history"
      ],
      "severity": "high"
    },
    "pattern_agent": {
      "score": 80,
      "findings": [
        "Similar pattern detected in known rug pulls",
        "Unusual transaction timing (3 AM local time)",
        "Amount matches typical scam threshold"
      ],
      "severity": "high"
    },
    "network_agent": {
      "score": 70,
      "findings": [
        "Network congestion minimal",
        "Gas fees normal",
        "Multiple similar transactions detected in last hour"
      ],
      "severity": "medium"
    },
    "ml_agent": {
      "score": 88,
      "prediction": "fraud",
      "confidence": 0.94
    }
  },
  "risk_factors": [
    {
      "factor": "new_token",
      "severity": "high",
      "description": "Token created less than 24 hours ago",
      "weight": 0.25
    },
    {
      "factor": "low_liquidity",
      "severity": "high",
      "description": "Liquidity below $10,000 threshold",
      "weight": 0.20
    },
    {
      "factor": "flagged_address",
      "severity": "high",
      "description": "Destination address has scam reports",
      "weight": 0.30
    },
    {
      "factor": "holder_concentration",
      "severity": "medium",
      "description": "Top holders control majority of supply",
      "weight": 0.15
    },
    {
      "factor": "suspicious_pattern",
      "severity": "medium",
      "description": "Transaction pattern matches known scams",
      "weight": 0.10
    }
  ],
  "recommendations": {
    "action": "block",
    "reason": "Multiple high-severity risk factors detected. Token characteristics match typical rug pull pattern.",
    "alternative_actions": [
      "Wait 48 hours and re-analyze",
      "Reduce transaction amount significantly",
      "Request manual review from security team"
    ]
  },
  "evidence": {
    "on_chain_data": {
      "token_metadata": {
        "name": "MoonRocket Token",
        "symbol": "MOON",
        "decimals": 9,
        "total_supply": "1000000000000",
        "created_at": "2024-01-01T00:00:00Z"
      },
      "holder_distribution": {
        "total_holders": 156,
        "top_10_percentage": 78.5,
        "unique_holders_24h": 12
      },
      "liquidity_pools": [
        {
          "dex": "Raydium",
          "liquidity_usd": 5432,
          "volume_24h": 8921
        }
      ]
    },
    "historical_patterns": {
      "similar_transactions": [
        {
          "signature": "3xKXtg...",
          "outcome": "scam_confirmed",
          "similarity_score": 0.87
        }
      ],
      "address_history": {
        "total_transactions": 8,
        "incoming": 2,
        "outgoing": 6,
        "first_seen": "2024-01-05T12:00:00Z"
      }
    },
    "external_sources": [
      {
        "source": "RugCheckXYZ",
        "data": {
          "risk_level": "high",
          "flags": ["new_token", "low_liquidity", "high_concentration"]
        }
      },
      {
        "source": "TokenSniffer",
        "data": {
          "score": 15,
          "warnings": ["Unverified contract", "Mint function active"]
        }
      }
    ]
  },
  "metadata": {
    "analysis_duration_ms": 2847,
    "agents_used": [
      "token_agent",
      "address_agent",
      "pattern_agent",
      "network_agent",
      "ml_agent"
    ],
    "data_sources": [
      "solana_rpc",
      "rugcheck_xyz",
      "token_sniffer",
      "internal_db"
    ],
    "timestamp": "2024-01-07T15:30:45.123Z",
    "version": "1.0.0"
  }
}
```

---

## 🏥 Health Check Endpoint

```
GET /api/analyze/health
```

### Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "agents": {
    "token_agent": "operational",
    "address_agent": "operational",
    "pattern_agent": "operational",
    "network_agent": "operational",
    "ml_agent": "operational"
  },
  "timestamp": "2024-01-07T15:30:45.123Z"
}
```

---

## ⚠️ Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "transaction.type",
      "message": "Invalid transaction type"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid API key"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "Analysis failed",
  "message": "Internal error occurred during analysis"
}
```

---

## 🔄 Rate Limiting

- **Rate Limit:** 100 requests per minute per API key
- **Burst:** Up to 10 concurrent requests

---

## 🎯 Integration Example (Node.js)

```javascript
const axios = require('axios');

async function analyzeTransaction(transactionData) {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/analyze',
      {
        transaction: {
          type: 'transfer',
          from_address: transactionData.from,
          to_address: transactionData.to,
          amount: transactionData.amount,
          token_address: transactionData.token,
          network: 'mainnet-beta',
        },
        context: {
          user_id: 'user-123',
        },
        preferences: {
          analysis_depth: 'standard',
          include_on_chain_data: true,
          include_ml_prediction: true,
          language: 'en',
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-api-key-here',
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Analysis failed:', error.message);
    throw error;
  }
}
```

---

## 📊 Performance Expectations

| Analysis Depth | Expected Duration | Data Sources |
|---------------|-------------------|--------------|
| **quick** | 500-1000ms | On-chain data only |
| **standard** | 1000-3000ms | On-chain + basic ML |
| **deep** | 3000-10000ms | All sources + advanced ML |

---

## 🔒 Security Considerations

1. **API Key:** Always use HTTPS in production
2. **Rate Limiting:** Implement proper rate limiting on your side
3. **Data Privacy:** Don't send sensitive user data
4. **Timeout:** Set appropriate timeout values (30s recommended)
5. **Retry Logic:** Implement exponential backoff for retries

---

## 📞 Support

Para questões sobre a API Multi-Agent:
- **Email:** multi-agent-support@vetra.com
- **Docs:** https://docs.vetra.com/multi-agent
- **Status:** https://status.vetra.com

---

## 📝 Changelog

### v1.0.0 (2024-01-07)
- Initial API specification
- Support for 5 specialized agents
- Multi-language support (EN, PT, ES)
- Comprehensive risk factor analysis

