# Vetra Backend

Backend API para análise de risco de transações Solana.

## Stack

- Node.js 18 + Express
- PostgreSQL 15 + Redis 7
- Solana Web3.js
- JWT Authentication

## Quick Start

```bash
# Install
npm install

# Setup
cp .env.example .env
# Edit .env

# Start services (Docker)
docker-compose up -d

# Migrate database
npm run db:migrate

# Run
npm run dev
```

API: http://localhost:3000  
Docs: http://localhost:3000/api/docs

## Main Endpoints

```
POST /api/auth/google           # OAuth login
POST /api/transactions/analyze  # Analyze transaction
GET  /api/transactions/history  # Transaction history
POST /api/attestations          # Create attestation
GET  /api/health                # Health check
```

## Database

4 tables: `users`, `transactions`, `attestations`, `providers`

Migrations: `npm run db:migrate`

## Scripts

```bash
npm run dev          # Development
npm start            # Production
npm test             # Tests
npm run db:migrate   # Migrations
npm run db:seed      # Seeds
```

## Documentation

- [API Spec](docs/MULTI_AGENT_API_SPEC.md)
- [Multi-Agent Guide](docs/MULTI_AGENT_IMPLEMENTATION_GUIDE.md)
- Swagger: `/api/docs`