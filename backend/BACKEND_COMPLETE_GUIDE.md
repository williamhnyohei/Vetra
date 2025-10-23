# 🚀 Guia Completo do Backend Vetra

## 📋 Índice
- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [APIs Implementadas](#-apis-implementadas)
- [Banco de Dados](#-banco-de-dados)
- [Serviços](#-serviços)
- [Segurança](#-segurança)
- [Fluxos de Dados](#-fluxos-de-dados)

---

## 🎯 Visão Geral

O backend do Vetra é uma **API REST completa** construída em **Node.js + Express** que:

1. ✅ **Autentica usuários** (Google OAuth + Guest mode)
2. ✅ **Analisa transações Solana** com IA Multi-Agente
3. ✅ **Armazena histórico** de transações analisadas
4. ✅ **Gerencia attestations** on-chain
5. ✅ **Sistema de reputação** para provedores
6. ✅ **Notificações em tempo real** via WebSocket
7. ✅ **Configurações de usuário** personalizáveis
8. ✅ **Monitoramento e métricas** completos

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Vetra Backend API                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Express    │  │  PostgreSQL  │  │    Redis     │     │
│  │   (API)      │  │  (Database)  │  │   (Cache)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Socket.IO   │  │ Solana Web3  │  │ Multi-Agent  │     │
│  │ (WebSocket)  │  │ (Blockchain) │  │   (AI/ML)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

**Core:**
- Node.js 18+
- Express.js 4.18
- PostgreSQL 15
- Redis 7

**Autenticação:**
- JWT (jsonwebtoken)
- Passport.js
- Google OAuth 2.0
- bcrypt para hashing

**Blockchain:**
- @solana/web3.js
- @solana/spl-token

**Real-time:**
- Socket.IO 4.7

**Segurança:**
- Helmet.js
- CORS
- express-rate-limit
- express-validator

**Monitoramento:**
- Winston (logging)
- Morgan (HTTP logs)
- Prometheus (metrics)
- Sentry (error tracking)

---

## 📡 APIs Implementadas

### **1. Autenticação (`/api/auth/*`)**

#### `POST /api/auth/google`
**Função:** Inicia login com Google OAuth
**Resposta:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar": "https://...",
    "provider": "google",
    "subscription_plan": "free"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### `POST /api/auth/guest`
**Função:** Login como visitante (sem registro)
**Body:**
```json
{
  "name": "Guest User" // opcional
}
```

#### `POST /api/auth/refresh`
**Função:** Renovar access token
**Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### `POST /api/auth/logout`
**Função:** Deslogar usuário
**Headers:** `Authorization: Bearer jwt-token`

#### `GET /api/auth/me`
**Função:** Obter dados do usuário atual
**Headers:** `Authorization: Bearer jwt-token`

---

### **2. Transações (`/api/transactions/*`)**

#### `POST /api/transactions/analyze` ⭐ **PRINCIPAL**
**Função:** Analisa uma transação Solana usando Multi-Agent System
**Headers:** `Authorization: Bearer jwt-token`
**Body:**
```json
{
  "transactionData": {
    "signature": "optional",
    "type": "transfer|swap|approve|mint|burn|other",
    "from": "wallet-address-from",
    "to": "wallet-address-to",
    "amount": "1.5",
    "token": "token-address" // opcional
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "analysis": {
    "score": 85,
    "level": "high",
    "confidence": 0.92,
    "reasons": [
      "Token created less than 24 hours ago",
      "Low liquidity detected",
      "Destination address flagged"
    ],
    "agent_analysis": {
      "token_agent": {
        "score": 90,
        "findings": [...],
        "severity": "high"
      },
      "address_agent": { ... },
      "pattern_agent": { ... },
      "network_agent": { ... },
      "ml_agent": { ... }
    },
    "recommendations": {
      "action": "block",
      "reason": "Multiple high-severity risk factors detected",
      "alternative_actions": [...]
    },
    "evidence": { ... },
    "metadata": { ... }
  },
  "transaction": {
    "id": "uuid",
    "risk_score": 85,
    "risk_level": "high",
    "status": "pending"
  },
  "cached": false
}
```

**O que faz:**
1. Valida os dados de entrada
2. Verifica cache Redis (se já analisou antes)
3. Chama Multi-Agent System API
4. Processa resposta dos agentes
5. Salva no PostgreSQL
6. Armazena em cache (1 hora)
7. Retorna análise completa

#### `GET /api/transactions/history`
**Função:** Histórico de transações analisadas
**Query Params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (pending|approved|rejected|completed)
- `risk_level` (low|medium|high)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### `GET /api/transactions/:id`
**Função:** Detalhes de uma transação específica

#### `PATCH /api/transactions/:id/status`
**Função:** Atualizar status (aprovar/rejeitar)
**Body:**
```json
{
  "status": "approved|rejected",
  "feedback": "optional user feedback"
}
```

#### `GET /api/transactions/stats/risk`
**Função:** Estatísticas de risco do usuário
**Resposta:**
```json
{
  "success": true,
  "stats": {
    "total_transactions": 150,
    "avg_risk_score": 45.5,
    "high_risk_count": 20,
    "medium_risk_count": 50,
    "low_risk_count": 80,
    "approved_count": 120,
    "rejected_count": 30
  }
}
```

---

### **3. Attestations (`/api/attestations/*`)**

#### `POST /api/attestations`
**Função:** Criar attestation on-chain
**Body:**
```json
{
  "transactionHash": "transaction-hash",
  "riskScore": 85,
  "riskLevel": "high",
  "stakeAmount": 5.0,
  "evidence": { ... }
}
```

**O que faz:**
1. Verifica se o usuário é um provider
2. Valida o stake mínimo (1 SOL)
3. Cria attestation na blockchain Solana
4. Salva no PostgreSQL
5. Atualiza estatísticas do provider

#### `GET /api/attestations`
**Função:** Listar attestations
**Query Params:**
- `page`, `limit`
- `transactionHash`
- `providerPubkey`
- `riskLevel`
- `verified`

#### `GET /api/attestations/:id`
**Função:** Detalhes de um attestation

#### `POST /api/attestations/:id/vote`
**Função:** Votar em um attestation
**Body:**
```json
{
  "vote": "approve|reject",
  "stakeAmount": 0.5
}
```

**O que faz:**
1. Provider vota em attestation de outro
2. Aposta SOL no voto
3. Registra on-chain
4. Atualiza verificação (>60% aprovação = verificado)

#### `POST /api/attestations/stake`
**Função:** Fazer stake de reputação
**Body:**
```json
{
  "amount": 10.0
}
```

#### `GET /api/attestations/providers/stats`
**Função:** Estatísticas de todos os providers
**Resposta:**
```json
{
  "success": true,
  "stats": {
    "total_providers": 50,
    "active_providers": 45,
    "verified_providers": 30,
    "avg_reputation": 650,
    "avg_stake": 500.0,
    "total_stake": 25000.0
  }
}
```

---

### **4. Usuários (`/api/users/*`)**

#### `GET /api/users/profile`
**Função:** Perfil do usuário

#### `PATCH /api/users/profile`
**Função:** Atualizar perfil
**Body:**
```json
{
  "name": "New Name",
  "avatar": "https://..."
}
```

#### `GET /api/users/settings`
**Função:** Configurações do usuário

#### `PATCH /api/users/settings`
**Função:** Atualizar configurações
**Body:**
```json
{
  "settings": { ... },
  "preferences": { ... }
}
```

#### `GET /api/users/stats`
**Função:** Estatísticas completas do usuário
**Resposta:**
```json
{
  "success": true,
  "stats": {
    "transactions": {
      "total_transactions": 150,
      "avg_risk_score": 45.5,
      ...
    },
    "recent_activity": [...],
    "subscription": {
      "plan": "free",
      "expires_at": null,
      "member_since": "2024-01-01"
    }
  }
}
```

#### `DELETE /api/users/account`
**Função:** Deletar conta permanentemente
**Body:**
```json
{
  "confirmation": "DELETE"
}
```

---

### **5. Configurações (`/api/settings/*`)**

#### `GET /api/settings`
**Função:** Todas as configurações

#### `PATCH /api/settings`
**Função:** Atualizar configurações
**Body:**
```json
{
  "theme": "dark|light|auto",
  "language": "en|pt|es",
  "notifications": { ... },
  "risk_threshold": 50,
  "auto_block_high_risk": false,
  "ai_rigidity": 50,
  "ai_language": "en",
  "share_insights": false,
  "transaction_memory": true,
  "smart_contract_fingerprints": true
}
```

#### `POST /api/settings/reset`
**Função:** Reset para configurações padrão

#### `GET /api/settings/notifications`
**Função:** Preferências de notificações

#### `PATCH /api/settings/notifications`
**Função:** Atualizar notificações
**Body:**
```json
{
  "email": true,
  "push": true,
  "risk_alerts": true,
  "attestation_updates": true
}
```

#### `GET /api/settings/languages`
**Função:** Idiomas disponíveis
**Resposta:**
```json
{
  "success": true,
  "languages": [
    { "code": "en", "name": "English", "native": "English" },
    { "code": "pt", "name": "Portuguese", "native": "Português" },
    { "code": "es", "name": "Spanish", "native": "Español" }
  ]
}
```

#### `GET /api/settings/themes`
**Função:** Temas disponíveis

---

### **6. Health & Monitoring (`/api/health/*`)**

#### `GET /api/health`
**Função:** Health check básico
**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-07T15:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "environment": "production"
}
```

#### `GET /api/health/detailed`
**Função:** Health check detalhado de todos os serviços
**Resposta:**
```json
{
  "status": "healthy",
  "checks": {
    "api": { "status": "healthy", "responseTime": 5 },
    "database": { "status": "healthy", "responseTime": 12 },
    "redis": { "status": "healthy", "responseTime": 3 },
    "solana": { "status": "healthy", "responseTime": 250 }
  },
  "memory": {
    "used": 150,
    "total": 512,
    "external": 10
  }
}
```

#### `GET /api/health/database`
**Função:** Status do PostgreSQL

#### `GET /api/health/redis`
**Função:** Status do Redis

#### `GET /api/health/solana`
**Função:** Status da conexão Solana

#### `GET /api/health/metrics`
**Função:** Métricas gerais do sistema

---

### **7. Métricas (`/api/metrics`)**

#### `GET /api/metrics`
**Função:** Métricas Prometheus
**Formato:** Prometheus text format

**Métricas incluídas:**
- `http_request_duration_seconds` - Duração de requests
- `http_requests_total` - Total de requests
- `active_connections` - Conexões ativas
- `risk_analysis_total` - Total de análises
- `attestations_total` - Total de attestations
- `database_connections` - Conexões DB
- `redis_connections` - Conexões Redis

---

### **8. WebSocket (`/ws` via Socket.IO)**

#### **Eventos Disponíveis:**

**Client → Server:**
- `analyze-transaction` - Solicita análise
- `vote-attestation` - Vota em attestation
- `update-settings` - Atualiza configurações
- `subscription-updated` - Atualiza plano

**Server → Client:**
- `analysis-started` - Análise iniciada
- `analysis-complete` - Análise concluída
- `analysis-error` - Erro na análise
- `vote-confirmed` - Voto confirmado
- `attestation-voted` - Novo voto recebido
- `settings-updated` - Settings atualizados
- `notification` - Notificação geral
- `risk-alert` - Alerta de alto risco
- `attestation-update` - Attestation atualizado

**Exemplo de uso:**
```javascript
const socket = io('wss://api.vetra.com', {
  auth: { token: 'jwt-token' }
});

// Solicitar análise
socket.emit('analyze-transaction', {
  transactionData: { ... }
});

// Receber resultado
socket.on('analysis-complete', (data) => {
  console.log('Risk Score:', data.analysis.score);
});
```

---

## 🗄️ Banco de Dados

### **PostgreSQL - 4 Tabelas:**

#### **1. users (Usuários)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  provider VARCHAR NOT NULL, -- 'google' | 'guest'
  provider_id VARCHAR,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  subscription_plan VARCHAR DEFAULT 'free', -- 'free' | 'pro'
  subscription_expires_at TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Armazena:**
- Dados de autenticação
- Perfil do usuário
- Plano de assinatura
- Preferências e configurações

#### **2. transactions (Transações)**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signature VARCHAR UNIQUE,
  transaction_hash VARCHAR,
  type VARCHAR NOT NULL, -- 'transfer' | 'swap' | 'approve' | etc
  from_address VARCHAR NOT NULL,
  to_address VARCHAR NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  token_address VARCHAR,
  token_symbol VARCHAR,
  risk_score INTEGER NOT NULL, -- 0-100
  risk_level VARCHAR NOT NULL, -- 'low' | 'medium' | 'high'
  risk_reasons JSONB DEFAULT '[]',
  heuristics JSONB DEFAULT '{}',
  status VARCHAR DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  user_approved BOOLEAN,
  user_feedback TEXT,
  metadata JSONB DEFAULT '{}',
  analyzed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Armazena:**
- Histórico de transações analisadas
- Risk scores e análises
- Feedback do usuário
- Status de aprovação/rejeição

#### **3. attestations (Atestados)**
```sql
CREATE TABLE attestations (
  id UUID PRIMARY KEY,
  provider_pubkey VARCHAR NOT NULL,
  transaction_hash VARCHAR NOT NULL,
  risk_score INTEGER NOT NULL, -- 0-100
  risk_level VARCHAR NOT NULL,
  stake_amount DECIMAL(20,8) NOT NULL, -- SOL apostado
  reputation INTEGER DEFAULT 0, -- 0-1000
  verified BOOLEAN DEFAULT false,
  evidence JSONB DEFAULT '{}',
  on_chain_signature VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Armazena:**
- Attestations on-chain
- Stake do provider
- Reputação no momento
- Evidências coletadas
- Status de verificação

#### **4. providers (Provedores)**
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY,
  pubkey VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  description TEXT,
  reputation INTEGER DEFAULT 0, -- 0-1000
  total_stake DECIMAL(20,8) DEFAULT 0,
  attestation_count INTEGER DEFAULT 0,
  successful_attestations INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0, -- 0.00-100.00%
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  last_attestation_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Armazena:**
- Dados dos provedores de attestation
- Reputação acumulada
- Stake total
- Taxa de acerto
- Status de verificação

---

## 🔧 Serviços

### **1. multiAgentRiskAnalyzer.js** ⭐ **PRINCIPAL**

**Função:** Integra com Sistema Multi-Agente externo

**Entrada:**
```javascript
{
  transaction: {
    signature, type, from_address, to_address,
    amount, token_address, network
  },
  context: {
    user_id, user_reputation, wallet_age_days
  },
  preferences: {
    analysis_depth, include_ml_prediction, language
  }
}
```

**Saída:**
```javascript
{
  risk_assessment: { score, level, confidence },
  agent_analysis: {
    token_agent: { score, findings, severity },
    address_agent: { score, findings, severity },
    pattern_agent: { score, findings, severity },
    network_agent: { score, findings, severity },
    ml_agent: { score, prediction, confidence }
  },
  risk_factors: [...],
  recommendations: { action, reason, alternatives },
  evidence: { on_chain_data, historical_patterns },
  metadata: { duration, agents_used, timestamp }
}
```

**Funcionalidades:**
- ✅ Cache Redis (evita análises duplicadas)
- ✅ Retry logic (3 tentativas com backoff)
- ✅ Fallback analysis (se Multi-Agent falhar)
- ✅ Health check do Multi-Agent
- ✅ Logging de performance

### **2. attestationService.js**

**Funções:**
- `createAttestation()` - Cria attestation on-chain
- `voteAttestation()` - Vota em attestation
- `stakeReputation()` - Faz stake de SOL
- `withdrawStake()` - Retira stake
- `getAttestationOnChain()` - Busca da blockchain
- `calculateReputation()` - Calcula reputação
- `verifyAttestationAccuracy()` - Verifica precisão

### **3. reputationService.js**

**Funções:**
- `updateProviderReputation()` - Atualiza reputação baseado em accuracy
- `calculateProviderReputation()` - Calcula score (0-1000)
- `getProviderLeaderboard()` - Ranking de providers
- `getProviderStats()` - Estatísticas detalhadas
- `updateProviderVerification()` - Atualiza status de verificação
- `calculateStakingRewards()` - Calcula recompensas
- `getReputationHistory()` - Histórico de reputação

**Cálculo de Reputação:**
```javascript
Reputação (0-1000) =
  Base (50) +
  Accuracy (0-300) +  // % de attestations corretos
  Stake (0-200) +     // Total de SOL apostado
  Time (0-150) +      // Tempo ativo
  Activity (0-100)    // Attestations recentes
```

### **4. riskAnalyzer.js** (Fallback)

**Função:** Análise básica quando Multi-Agent não está disponível

**Heurísticas:**
1. Amount analysis (20 pontos)
2. Address reputation (25 pontos)
3. Token analysis (20 pontos)
4. Transaction type (15 pontos)
5. Network analysis (10 pontos)
6. Time patterns (10 pontos)

---

## 🔐 Segurança

### **Camadas de Proteção:**

#### **1. Autenticação**
- ✅ JWT tokens com expiração
- ✅ Refresh tokens (30 dias)
- ✅ Google OAuth 2.0 seguro
- ✅ Validação de tokens

#### **2. Rate Limiting**
```javascript
- API geral: 100 req/15min por IP
- Autenticação: 5 req/15min por IP
- Análise de risco: 10 req/1min por IP
- Attestations: 5 req/1min por IP
- WebSocket: 30 eventos/1min
```

#### **3. Headers de Segurança (Helmet.js)**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff

#### **4. Input Validation**
- express-validator em todos os endpoints
- Sanitização de dados
- Type checking
- Length limits

#### **5. CORS**
- Whitelist de origens
- Credentials permitidos
- Métodos HTTP específicos

#### **6. Proteção de Dados**
- Senhas hasheadas (bcrypt)
- JWT secrets seguros
- Conexões SSL/TLS
- Dados sensíveis em .env

---

## 🔄 Fluxos de Dados

### **Fluxo 1: Análise de Transação**

```
1. Frontend envia transação
   POST /api/transactions/analyze
   ↓
2. Backend valida dados
   ↓
3. Verifica cache Redis
   ├─ Se existe → retorna cache
   └─ Se não existe → continua
   ↓
4. Chama Multi-Agent System
   POST http://multi-agent:5000/api/analyze
   ↓
5. Multi-Agent processa:
   ├─ Token Agent analisa token
   ├─ Address Agent verifica endereços
   ├─ Pattern Agent detecta padrões
   ├─ Network Agent checa rede
   └─ ML Agent prediz com modelo
   ↓
6. Multi-Agent retorna análise agregada
   ↓
7. Backend salva no PostgreSQL
   ↓
8. Backend armazena em cache Redis (1h)
   ↓
9. Backend retorna para Frontend
   ↓
10. Frontend exibe score e recomendações
```

### **Fluxo 2: Criação de Attestation**

```
1. Provider cria attestation
   POST /api/attestations
   Body: { transactionHash, riskScore, stakeAmount }
   ↓
2. Backend valida provider e stake
   ↓
3. Cria attestation on-chain (Solana)
   - Programa Anchor executa
   - SOL é transferido para stake
   ↓
4. Backend salva no PostgreSQL
   - Attestation com signature on-chain
   ↓
5. Backend atualiza stats do provider
   - Incrementa attestation_count
   - Atualiza total_stake
   ↓
6. Backend retorna confirmação
   ↓
7. Outros providers podem votar
   POST /api/attestations/:id/vote
   ↓
8. Se >60% aprovação → verified = true
```

### **Fluxo 3: Autenticação Google**

```
1. Frontend inicia login
   Redireciona para Google OAuth
   ↓
2. Usuário autentica no Google
   ↓
3. Google redireciona para callback
   GET /api/auth/google/callback
   ↓
4. Backend recebe dados do Google
   - Email, nome, foto
   ↓
5. Backend verifica se usuário existe
   ├─ Existe → atualiza last_login_at
   └─ Não existe → cria novo usuário
   ↓
6. Backend gera JWT tokens
   - Access token (7 dias)
   - Refresh token (30 dias)
   ↓
7. Backend armazena refresh token no Redis
   ↓
8. Backend retorna tokens + dados do usuário
   ↓
9. Frontend armazena tokens
   - Access token para requests
   - Refresh token para renovação
```

### **Fluxo 4: WebSocket Real-time**

```
1. Frontend conecta WebSocket
   io('wss://api.vetra.com', { auth: { token: jwt }})
   ↓
2. Backend autentica via JWT
   ↓
3. Backend adiciona usuário a rooms
   - user:${userId}
   - pro-users (se for Pro)
   ↓
4. Eventos em tempo real:
   
   A) Análise de transação:
      Frontend: emit('analyze-transaction')
      Backend: processa
      Backend: emit('analysis-complete')
   
   B) Alerta de alto risco:
      Backend detecta risk_score >= 70
      Backend: emit('high-risk-alert') para pro-users
   
   C) Atualização de attestation:
      Provider cria/vota attestation
      Backend: emit('attestation-update') para todos
   
   D) Mudança de configurações:
      Frontend: emit('update-settings')
      Backend: salva no DB
      Backend: emit('settings-updated')
```

---

## 📊 Sistema de Cache (Redis)

### **O que é cacheado:**

1. **Análises de risco** (1 hora)
   ```
   Key: risk:${transactionHash}
   Value: { score, level, reasons, ... }
   ```

2. **Sessões de usuário** (24 horas)
   ```
   Key: session:${sessionId}
   Value: { userId, email, ... }
   ```

3. **Refresh tokens** (30 dias)
   ```
   Key: refresh:${userId}
   Value: refresh-token-string
   ```

4. **Rate limiting** (15 minutos)
   ```
   Key: rate_limit:ip:${ipAddress}
   Value: request_count
   ```

5. **Dados de usuário** (1 hora)
   ```
   Key: user:${userId}
   Value: { profile, settings, ... }
   ```

---

## 🤖 Integração Multi-Agente

### **Como Funciona:**

O backend **NÃO faz a análise de risco**, ele **delega** para um sistema externo especializado (Multi-Agent System).

### **Responsabilidades:**

**Backend (Node.js):**
- Recebe transação do frontend
- Valida dados
- Chama Multi-Agent API (HTTP POST)
- Processa resposta
- Salva no banco
- Retorna para frontend

**Multi-Agent System (Python/IA):**
- Analisa token (liquidez, idade, holders)
- Analisa endereços (reputação, histórico)
- Detecta padrões (rug pull, pump&dump)
- Verifica rede (congestionamento, gas)
- Prediz com ML (Random Forest, LSTM)
- Retorna score agregado (0-100)

### **Por que essa separação?**

✅ **Escalabilidade** - Multi-Agent pode rodar em servidores separados
✅ **Especialização** - Python melhor para IA/ML
✅ **Independência** - Sistemas podem evoluir separadamente
✅ **Performance** - Análise pesada não bloqueia API
✅ **Testabilidade** - Mock server para desenvolvimento

---

## 📈 Monitoramento

### **1. Logs (Winston)**

**Níveis:**
- `error` - Erros críticos
- `warn` - Avisos
- `info` - Informações gerais
- `debug` - Debug detalhado

**Arquivos:**
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs
- `logs/access.log` - Logs HTTP

**Logs estruturados:**
```json
{
  "level": "info",
  "message": "Risk Analysis",
  "transactionId": "tx-123",
  "riskScore": 85,
  "riskLevel": "high",
  "timestamp": "2024-01-07T15:30:00Z"
}
```

### **2. Métricas (Prometheus)**

**Coletadas automaticamente:**
- Request duration
- Request count por rota
- Active connections
- Database queries
- Cache hit rate
- Error rate

### **3. Error Tracking (Sentry)**

**Configurado para:**
- Capturar exceções não tratadas
- Stack traces completos
- Environment context
- User context (quando disponível)
- Performance profiling

---

## 🐳 Deploy

### **Docker Compose (Development):**

```yaml
services:
  postgres:  # Banco de dados
  redis:     # Cache
  api:       # Backend API
  nginx:     # Load balancer
```

**Comando:**
```bash
docker-compose up -d
```

### **Docker Compose (Production):**

```yaml
services:
  postgres:  # Com persistent volumes
  redis:     # Com persistent volumes
  api:       # Multi-instance
  nginx:     # Com SSL/TLS
```

**Comando:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### **Railway (Cloud):**

- Arquivo `railway.json` configurado
- Nixpacks detecta Node.js automaticamente
- Auto-deploy no git push
- PostgreSQL e Redis inclusos
- HTTPS automático

---

## 📊 Estatísticas do Backend

```
📦 Dependências: 20+ packages
🛣️  Rotas: 30+ endpoints
🗄️  Tabelas: 4 no PostgreSQL
🔧 Serviços: 4 principais
🛡️  Middlewares: 10+
📝 Configurações: 14 módulos
🧪 Tests: Configurado (Jest)
🐳 Docker: Pronto
📚 Docs: Completas
```

---

## 🎯 **Resumo: O que o Backend FAZ**

### **Em Termos Simples:**

1. **Recebe requisições** do Chrome Extension
2. **Autentica usuários** com Google ou Guest
3. **Chama Sistema Multi-Agente** para analisar transações
4. **Armazena tudo** em PostgreSQL
5. **Cache inteligente** com Redis
6. **Notifica em tempo real** via WebSocket
7. **Gerencia attestations** on-chain
8. **Calcula reputação** de providers
9. **Monitora tudo** com logs e métricas
10. **Escala facilmente** com Docker

### **Analogia:**

O backend é como um **coordenador inteligente**:
- Recebe pedidos de análise
- Delega o trabalho pesado (IA) para especialistas
- Armazena histórico
- Gerencia reputação
- Notifica quando necessário
- Mantém tudo seguro e rápido

**É o "cérebro organizacional" do Vetra! 🧠**
