# Vetra

> Chrome Extension (MV3) que analisa transações Solana antes de assinar. Análise local com heurísticas, risk score visual e attestations on-chain via Anchor com sistema de reputação. Privacy-first por padrão.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/anchor-0.29.0-purple.svg)](https://www.anchor-lang.com/)
[![React](https://img.shields.io/badge/react-18.2-blue.svg)](https://react.dev/)

## 🎯 Features

- ✅ **Análise de Risco em Tempo Real** - Analisa transações antes de assinar
- 🔒 **Privacy First** - Toda análise roda localmente por padrão
- 📊 **Risk Score Visual** - Scoring 0-100 com indicadores de cor
- 🏆 **Attestations On-Chain** - Sinais comunitários (opcional)
- 💎 **Sistema de Reputação** - Staking para signal providers
- 📱 **UI Moderna** - Tema dark profissional (430x718px)

## 🏗️ Arquitetura

**Estrutura Separada Frontend/Backend:**

```
vetra/
├── frontend/              # 🎨 Chrome Extension
│   ├── extension/        # React + Vite + TypeScript
│   └── assets/           # SVG icons e logos
│
├── backend/              # ⚙️ Solana Programs
│   └── programs/         # Anchor Framework
│       └── attestation/  # Programa de attestations
│
└── docs/                 # 📚 Documentação
```

**Stack Tecnológica:**
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Zustand
- **Backend**: Anchor 0.29.0, Rust, Solana
- **Monorepo**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ e pnpm
node --version  # v18.0.0+
pnpm --version  # 8.0.0+

# Rust e Solana CLI
rustc --version
solana --version

# Anchor
anchor --version  # 0.29.0
```

### Instalação

```bash
# Clone
git clone <repository-url>
cd vetra

# Instalar dependências
pnpm install
```

### Desenvolvimento

**Frontend (Extension):**
```bash
cd frontend/extension
pnpm install
pnpm dev

# Build e carregar no Chrome
pnpm build
# Carregar em chrome://extensions/ → Load unpacked → frontend/extension/dist/
```

**Backend (Solana):**
```bash
cd backend/programs

# Iniciar validador local
solana-test-validator

# Build e test
anchor build
anchor test
```

## 📦 Estrutura do Projeto

### 🎨 Frontend

```
frontend/
├── extension/
│   ├── src/
│   │   ├── popup/          # UI React (Home, History, Settings)
│   │   ├── background/     # Service Worker MV3
│   │   ├── content/        # Content Script (bridge)
│   │   ├── injected/       # window.solana wrapper
│   │   ├── lib/            # Core logic
│   │   │   ├── risk-analyzer/   # Heurísticas locais
│   │   │   ├── solana/          # Cliente Solana
│   │   │   └── attestations/    # Fetch on-chain
│   │   ├── store/          # Zustand state
│   │   ├── types/          # TypeScript types
│   │   └── styles/         # Global CSS + Tailwind
│   └── public/
│       └── manifest.json
│
└── assets/                 # SVG icons organizados
    ├── logo.svg
    ├── icon-*.svg
    └── README.md
```

### ⚙️ Backend

```
backend/
└── programs/
    └── attestation/        # Programa Anchor
        └── src/
            ├── instructions/   # 4 instruções
            │   ├── create_attestation.rs
            │   ├── stake_reputation.rs
            │   ├── vote_attestation.rs
            │   └── withdraw_stake.rs
            ├── state/          # Account structures
            │   ├── attestation.rs
            │   └── provider.rs
            └── errors.rs
```

## 📖 Documentação

- **[Frontend README](frontend/README.md)** - Desenvolvimento da extensão
- **[Backend README](backend/README.md)** - Programas Solana
- **[GETTING_STARTED](GETTING_STARTED.md)** - Guia de início rápido
- **[ARCHITECTURE](docs/ARCHITECTURE.md)** - Design do sistema
- **[DEVELOPMENT](docs/DEVELOPMENT.md)** - Guia de desenvolvimento

## 🎨 Design

**Figma:**  
https://www.figma.com/design/JiMUat5vZNmV2lQ3Xcf16B/VETRA-IA

**Paleta de Cores:**
- Primary: `#FBB500` (dourado)
- Background: `#121212` (escuro)
- Cards: `#1E1E1E`
- Risk Low: `#00D386` 🟢
- Risk Medium: `#F5A524` 🟡
- Risk High: `#AC1010` 🔴

## 🔐 Como Funciona

1. **User inicia transação** em dApp Solana
2. **Vetra intercepta** `window.solana.signTransaction()`
3. **Análise local** (heurísticas: token, program, amount)
4. **Risk score** calculado (0-100)
5. **Opcional**: Busca attestations on-chain
6. **User revisa** e aprova/rejeita

## 🌟 Sistema de Attestations

Signal providers podem:
- **Stake SOL** (mínimo 1 SOL)
- **Criar attestations** para transações
- **Ganhar reputação** (0-1000) via accuracy
- **Votar** em attestations de outros
- **Withdraw** após 7 dias de cooldown

## 📜 Scripts

```bash
# Frontend
pnpm dev                    # Dev extension
pnpm build:frontend         # Build extension

# Backend
pnpm build:backend          # Build Anchor programs
pnpm test:backend           # Test programs

# Geral
pnpm build                  # Build tudo
pnpm test                   # Test tudo
pnpm lint                   # Lint código
pnpm format                 # Format código

# Deploy
pnpm deploy:devnet          # Deploy em devnet
pnpm deploy:mainnet         # Deploy em mainnet
```

## 🔄 CI/CD

### 🚀 Workflows Automatizados

- **[CI Pipeline](.github/workflows/ci.yml)** - Testes, linting e build automático
- **[Release Pipeline](.github/workflows/release.yml)** - Deploy automático para Chrome Web Store
- **[Dependabot](.github/dependabot.yml)** - Atualizações automáticas de dependências

### 📊 Status Checks

- ✅ **Linting**: ESLint + Prettier
- ✅ **Type Checking**: TypeScript
- ✅ **Testing**: Jest + React Testing Library
- ✅ **Build**: Vite + Chrome Extension
- ✅ **Security**: Dependabot + CodeQL

### 🏷️ Releases

- **Automático**: Tags `v*` disparam releases
- **Chrome Web Store**: Deploy automático
- **Changelog**: Gerado automaticamente
- **Artifacts**: Builds disponíveis para download

## 🤝 Contribuindo

### 📋 Templates Disponíveis

Este repositório inclui templates para facilitar contribuições:

- **[Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)** - Para reportar bugs
- **[Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)** - Para sugerir funcionalidades
- **[Pull Request Template](.github/pull_request_template.md)** - Para padronizar PRs
- **[Contributing Guidelines](CONTRIBUTING.md)** - Guia completo de contribuição
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Código de conduta da comunidade
- **[Security Policy](SECURITY.md)** - Política de segurança

### 🚀 Processo de Contribuição

```bash
# Fork e clone
git checkout -b feature/minha-feature

# Desenvolva e teste
pnpm test
pnpm lint

# Commit (conventional commits)
git commit -m "feat: adiciona feature incrível"

# Push e abra PR
git push origin feature/minha-feature
```

### 📝 Convenções

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches**: `feat/`, `fix/`, `docs/`, `style/`, `refactor/`, `test/`, `chore/`
- **PRs**: Use o template fornecido
- **Issues**: Use os templates de bug report ou feature request

## 🔒 Segurança

- **Privacy First**: Sem tracking ou analytics
- **Análise Local**: Heurísticas client-side
- **Open Source**: Código auditável
- **Opt-in Network**: Attestations são opcionais
- **Sistema de Reputação**: Incentivos econômicos

## 📄 License

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/vetra/vetra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vetra/vetra/discussions)

---

**Construído com ❤️ para o ecossistema Solana**

**Versão**: 0.1.0  
**Status**: 🚧 Em Desenvolvimento
