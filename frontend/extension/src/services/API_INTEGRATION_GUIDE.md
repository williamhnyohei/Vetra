# 🔗 API Integration Guide - Multi-Agent System (MAS)

## 📋 Overview

Este guia mostra como conectar o frontend da extensão com a API do Multi-Agent System (MAS) no backend.

## 🎯 Arquivos Principais

### 1. **`api-service.ts`** - Serviço de API
- **Localização**: `frontend/extension/src/services/api-service.ts`
- **Função**: Gerencia todas as chamadas HTTP para o backend
- **Uso**: 
  ```typescript
  import ApiService from '../services/api-service';
  
  const apiService = ApiService.getInstance();
  const response = await apiService.analyzeTransaction(transactionData);
  ```

### 2. **`useRiskAnalysis.ts`** - Hook React
- **Localização**: `frontend/extension/src/hooks/useRiskAnalysis.ts`
- **Função**: Hook customizado para análise de risco
- **Uso**:
  ```typescript
  import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
  
  const { analysis, isAnalyzing, error, analyzeTransaction } = useRiskAnalysis();
  
  // Analisar transação
  await analyzeTransaction({
    type: 'transfer',
    from: 'sender_address',
    to: 'recipient_address',
    amount: '1.5',
    token: 'SOL'
  });
  ```

### 3. **`TransactionAnalyzer.tsx`** - Componente de Exemplo
- **Localização**: `frontend/extension/src/components/TransactionAnalyzer.tsx`
- **Função**: Componente exemplo de como usar o MAS
- **Uso**: Copie e adapte para suas necessidades

## 🚀 Como Usar

### Passo 1: Configurar a URL da API

No arquivo `.env`:
```env
VITE_API_URL=https://vetra-production.up.railway.app/api
```

### Passo 2: Importar e Usar no seu Componente

```typescript
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';

function MyComponent() {
  const { analysis, isAnalyzing, error, analyzeTransaction } = useRiskAnalysis();

  const handleAnalyze = async () => {
    await analyzeTransaction({
      type: 'transfer',
      from: fromAddress,
      to: toAddress,
      amount: amount,
      token: 'SOL'
    });
  };

  return (
    <div>
      {isAnalyzing && <p>Analyzing...</p>}
      {error && <p>Error: {error}</p>}
      {analysis && (
        <div>
          <p>Risk Score: {analysis.score}</p>
          <p>Risk Level: {analysis.level}</p>
          <p>Confidence: {analysis.confidence}</p>
        </div>
      )}
      <button onClick={handleAnalyze}>Analyze</button>
    </div>
  );
}
```

## 📡 Endpoints Disponíveis

### 1. Analisar Transação (MAS)
```typescript
POST /api/transactions/analyze
Body: {
  transactionData: {
    type: string,
    from: string,
    to: string,
    amount: string,
    token?: string,
    signature?: string
  }
}
Response: {
  success: boolean,
  analysis: {
    score: number,
    level: 'low' | 'medium' | 'high',
    reasons: string[],
    heuristics: {...},
    agentAnalysis: {...},
    recommendations: string[],
    confidence: number
  }
}
```

### 2. Histórico de Transações
```typescript
GET /api/transactions/history?page=1&limit=10
Response: {
  success: boolean,
  transactions: Transaction[],
  pagination: {...}
}
```

### 3. Estatísticas de Risco
```typescript
GET /api/transactions/stats/risk
Response: {
  success: boolean,
  stats: {
    total_transactions: number,
    avg_risk_score: number,
    high_risk_count: number,
    medium_risk_count: number,
    low_risk_count: number
  }
}
```

### 4. Criar Attestation
```typescript
POST /api/attestations
Body: {
  transactionHash: string,
  riskScore: number,
  riskLevel: 'low' | 'medium' | 'high',
  stakeAmount: string
}
Response: {
  success: boolean,
  attestation: {...},
  signature: string
}
```

## 🎨 Exemplo Completo

```typescript
import React, { useState } from 'react';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import ApiService from '../services/api-service';

export function TransactionChecker() {
  const { analysis, isAnalyzing, error, analyzeTransaction } = useRiskAnalysis();
  const [txData, setTxData] = useState({
    from: '',
    to: '',
    amount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Analisar com MAS
    await analyzeTransaction({
      type: 'transfer',
      from: txData.from,
      to: txData.to,
      amount: txData.amount,
      token: 'SOL'
    });
  };

  // Buscar histórico
  const fetchHistory = async () => {
    const apiService = ApiService.getInstance();
    const history = await apiService.getTransactionHistory({
      page: 1,
      limit: 10
    });
    console.log('Transaction history:', history);
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    const apiService = ApiService.getInstance();
    const stats = await apiService.getRiskStats();
    console.log('Risk stats:', stats);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={txData.from}
          onChange={(e) => setTxData({ ...txData, from: e.target.value })}
          placeholder="From address"
        />
        <input
          value={txData.to}
          onChange={(e) => setTxData({ ...txData, to: e.target.value })}
          placeholder="To address"
        />
        <input
          value={txData.amount}
          onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
          placeholder="Amount"
        />
        <button type="submit" disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {analysis && (
        <div className="results">
          <h3>Risk Analysis</h3>
          <p>Score: {analysis.score}/100</p>
          <p>Level: {analysis.level}</p>
          <p>Confidence: {(analysis.confidence * 100).toFixed(0)}%</p>
          
          <h4>Reasons:</h4>
          <ul>
            {analysis.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
          
          <h4>Recommendations:</h4>
          <ul>
            {analysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={fetchHistory}>View History</button>
      <button onClick={fetchStats}>View Stats</button>
    </div>
  );
}
```

## 🔐 Autenticação

O `ApiService` automaticamente adiciona o token de autenticação nas requisições:

```typescript
import ApiService from '../services/api-service';
import AuthService from '../services/auth-service';

// Após login
const authService = AuthService.getInstance();
const apiService = ApiService.getInstance();

// Definir token
const authState = authService.getAuthState();
if (authState.token) {
  apiService.setAuthToken(authState.token);
}
```

## 🐛 Debug

Para ver logs das requisições, abra o DevTools do Chrome:
```javascript
// Todas as requisições logam automaticamente:
console.log('🌐 API Request:', url, config);
console.log('✅ API Response:', data);
console.error('❌ API Error:', error);
```

## 📚 Referências

- **Backend API**: `backend/src/routes/transactions.js`
- **MAS Service**: `backend/src/services/multiAgentRiskAnalyzer.js`
- **API Docs**: Ver `backend/docs/API.md` (se disponível)

## 🎯 Próximos Passos

1. **Copie** os arquivos criados
2. **Adapte** o componente `TransactionAnalyzer.tsx` para suas necessidades
3. **Integre** em seus componentes existentes
4. **Teste** com transações reais
5. **Monitore** os logs no console

## ❓ Dúvidas?

- A API está rodando em: `https://vetra-production.up.railway.app`
- Todos os endpoints começam com `/api/`
- Autenticação é feita via Bearer token no header
- O MAS analisa transações em tempo real

**Happy coding! 🚀**
