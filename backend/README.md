# 🚀 Vetra Backend API

Backend API para análise de risco de transações Solana com sistema de attestations on-chain.

## 🏗️ Arquitetura

### Stack Tecnológica
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Solana Web3.js** - Integração blockchain
- **JWT** - Autenticação
- **WebSocket** - Notificações em tempo real

### Funcionalidades
- ✅ **Análise de Risco** - Heurísticas para detecção de fraudes
- ✅ **Autenticação** - Google OAuth + Guest mode
- ✅ **Attestations** - Sistema de reputação on-chain
- ✅ **Histórico** - Armazenamento de transações
- ✅ **Notificações** - Alertas em tempo real
- ✅ **Rate Limiting** - Proteção contra spam

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

### Instalação Local

```bash
# Clone o repositório
git clone <repository-url>
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações
npm run db:migrate

# Executar seeds (opcional)
npm run db:seed

# Iniciar em desenvolvimento
npm run dev
```

### Instalação com Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Executar migrações
docker-compose exec api npm run db:migrate

# Ver logs
docker-compose logs -f api
```

## 📊 Banco de Dados

### Estrutura das Tabelas

#### Users
- Armazena informações de usuários
- Suporte a Google OAuth e Guest mode
- Planos de assinatura (Free/Pro)

#### Transactions
- Histórico de transações analisadas
- Scores de risco e heurísticas
- Status e feedback do usuário

#### Attestations
- Attestations on-chain
- Sistema de reputação
- Stake e verificação

#### Providers
- Provedores de attestation
- Reputação e accuracy
- Stake total

## 🔧 API Endpoints

### Autenticação
```
POST /api/auth/google          # Login Google OAuth
POST /api/auth/guest           # Login Guest
POST /api/auth/refresh         # Refresh token
POST /api/auth/logout          # Logout
GET  /api/auth/me              # Dados do usuário
```

### Transações
```
POST /api/transactions/analyze  # Analisar transação
GET  /api/transactions/history  # Histórico
GET  /api/transactions/:id      # Transação específica
PATCH /api/transactions/:id/status # Atualizar status
GET  /api/transactions/stats/risk # Estatísticas
```

### Attestations
```
GET  /api/attestations         # Listar attestations
POST /api/attestations          # Criar attestation
GET  /api/attestations/:id      # Attestation específica
POST /api/attestations/:id/vote # Votar em attestation
```

### Usuários
```
GET  /api/users/profile         # Perfil do usuário
PATCH /api/users/profile        # Atualizar perfil
GET  /api/users/settings        # Configurações
PATCH /api/users/settings       # Atualizar configurações
```

## 🛡️ Segurança

### Autenticação
- JWT tokens com refresh
- Google OAuth 2.0
- Rate limiting por usuário
- Validação de entrada

### Proteção
- Helmet.js para headers de segurança
- CORS configurado
- Rate limiting global
- Validação de dados

## 📈 Monitoramento

### Logs
- Winston logger
- Níveis: error, warn, info, debug
- Rotação automática
- Estruturado em JSON

### Métricas
- Health checks
- Performance monitoring
- Error tracking
- Database queries

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Produção
```bash
# Build da aplicação
npm run build

# Iniciar em produção
npm start
```

### Docker
```bash
# Build da imagem
docker build -t vetra-api .

# Executar container
docker run -p 3000:3000 vetra-api
```

## 📚 Documentação

### Swagger/OpenAPI
- Documentação automática
- Endpoint: `/api/docs`
- Interativo para testes

### Postman Collection
- Collection completa
- Environment configurado
- Testes automatizados

## 🔧 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento
npm run start        # Produção
npm run build        # Build
npm test             # Testes
npm run lint         # Linting
npm run db:migrate   # Migrações
npm run db:seed      # Seeds
```

### Estrutura de Pastas
```
src/
├── config/          # Configurações
├── middleware/       # Middlewares
├── routes/          # Rotas da API
├── services/        # Serviços de negócio
├── models/          # Modelos de dados
├── utils/           # Utilitários
└── server.js        # Entry point
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/vetra/vetra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vetra/vetra/discussions)
- **Email**: support@vetra.com

---

**Construído com ❤️ para o ecossistema Solana**