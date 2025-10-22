# 🛡️ Vetra - Your Crypto Fraud Detector

<div align="center">

![Vetra Logo](frontend/assets/logo.svg)

**Chrome Extension (MV3) that protects you from crypto scams before you sign transactions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue)](https://chrome.google.com/webstore)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-purple)](https://solana.com/)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 What is Vetra?

Vetra is an **AI-powered Chrome Extension** that analyzes Solana transactions **before you sign them**, protecting you from:

- 🚫 **Rug Pulls** - Detects suspicious token patterns
- 🎣 **Phishing Attacks** - Identifies malicious contracts
- 💸 **Honeypots** - Warns about non-sellable tokens
- 🔓 **Unlimited Approvals** - Alerts on dangerous permissions
- 🕵️ **Scam Addresses** - Checks against known scammer databases

### Why Vetra?

- ✅ **Multi-Agent AI System** - 5 specialized AI agents analyze every transaction
- ✅ **On-Chain Attestations** - Decentralized reputation system
- ✅ **Privacy First** - Your wallet keys never leave your device
- ✅ **Real-Time Protection** - Instant risk analysis
- ✅ **Free & Pro Plans** - Start free, upgrade for advanced features

---

## 🚀 Features

### For Users

- 🔍 **Real-Time Risk Analysis** - Instant fraud detection
- 📊 **Risk Score (0-100)** - Clear, easy-to-understand ratings
- 🧠 **AI Explainability** - Understand WHY a transaction is risky
- 📜 **Transaction History** - Review past analyses
- 🌐 **Multi-Language** - English, Portuguese, Spanish
- 🎨 **Beautiful UI** - Clean, intuitive interface

### For Developers

- 🤖 **Multi-Agent System** - Extensible AI architecture
- 🔗 **REST API** - Integrate risk analysis into your app
- 📡 **WebSocket** - Real-time notifications
- 🗄️ **PostgreSQL + Redis** - Scalable data layer
- 🐳 **Docker Ready** - Easy deployment
- 📚 **Full Documentation** - Comprehensive guides

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vetra Ecosystem                         │
├─────────────────┬───────────────────┬──────────────────────┤
│  Chrome Ext     │   Backend API     │  Multi-Agent System  │
│  (React + TS)   │   (Node.js)       │  (Python + AI)       │
├─────────────────┼───────────────────┼──────────────────────┤
│ • UI/UX         │ • REST API        │ • Token Agent        │
│ • Wallet Hook   │ • WebSocket       │ • Address Agent      │
│ • State Mgmt    │ • PostgreSQL      │ • Pattern Agent      │
│ • i18n          │ • Redis Cache     │ • Network Agent      │
│                 │ • Auth (OAuth)    │ • ML Agent           │
└─────────────────┴───────────────────┴──────────────────────┘
         │                  │                    │
         └──────────────────┴────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Solana Blockchain│
                    │  (Attestations)  │
                    └──────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS
- Zustand (State)
- Vite (Build)
- Chrome Extension MV3

**Backend:**
- Node.js 18 + Express
- PostgreSQL 15
- Redis 7
- Socket.IO
- Docker

**AI System:**
- Python + FastAPI
- Scikit-learn
- TensorFlow
- Solana Web3.js

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (optional)
- Chrome Browser

### 1. Clone Repository

```bash
git clone https://github.com/vetra/vetra.git
cd vetra
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configurations

# Frontend
cd ../frontend/extension
cp .env.example .env
```

### 4. Start Development

```bash
# Terminal 1: Start backend
cd backend
docker-compose up -d  # Start PostgreSQL + Redis
npm run db:migrate    # Run migrations
npm run dev           # Start API

# Terminal 2: Start frontend
cd frontend/extension
npm run dev           # Start extension in dev mode
```

### 5. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `frontend/extension/dist` folder
5. Pin the Vetra extension

---

## 📖 Documentation

### User Guides
- 📘 [Getting Started](docs/user/getting-started.md)
- 🔐 [Security Best Practices](docs/user/security.md)
- 💎 [Free vs Pro Comparison](docs/user/plans.md)

### Developer Guides
- 🏗️ [Architecture Overview](docs/ARCHITECTURE.md)
- 🔧 [Development Guide](docs/DEVELOPMENT.md)
- 🤖 [Multi-Agent System](backend/docs/MULTI_AGENT_IMPLEMENTATION_GUIDE.md)
- 📡 [API Reference](backend/docs/MULTI_AGENT_API_SPEC.md)
- 🐳 [Docker Deployment](docs/deployment/docker.md)

### API Documentation
- 📚 **Swagger UI:** http://localhost:3000/api/docs
- 📊 **Health Check:** http://localhost:3000/api/health
- 📈 **Metrics:** http://localhost:3000/api/metrics

---

## 🎨 UI/UX

### Design System

- **Colors:** Dark theme with Vetra yellow (#FBB500)
- **Typography:** Arial, clean and readable
- **Dimensions:** 420x600px popup
- **Border Radius:** 14px throughout
- **Icons:** Custom SVG icon set

### Figma Design

🎨 [View Full Design](https://www.figma.com/design/JiMUat5vZNmV2lQ3Xcf16B/VETRA-IA?node-id=0-1&p=f&t=gKMVmx0XK3GGZ6ug-0)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend/extension
npm test
npm run test:e2e

# Multi-Agent System tests
cd multi-agent
pytest
pytest --cov
```

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Branch Naming Convention

- `front-X/feature-name` - Frontend features
- `back-X/feature-name` - Backend features
- `ai-X/feature-name` - AI/ML features
- `fix-X/bug-description` - Bug fixes
- `docs-X/documentation` - Documentation

---

## 📊 Project Status

### ✅ Completed
- [x] Frontend UI (7 screens)
- [x] Backend API (30+ endpoints)
- [x] Database schema (4 tables)
- [x] Authentication (OAuth + Guest)
- [x] WebSocket real-time
- [x] Docker setup
- [x] CI/CD pipeline

### 🚧 In Progress
- [ ] Multi-Agent AI System
- [ ] On-chain attestations (Anchor)
- [ ] Chrome Web Store submission
- [ ] Production deployment

### 🔮 Planned
- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Ethereum, etc)
- [ ] Browser extension (Firefox, Brave)
- [ ] API marketplace

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** - For the amazing blockchain
- **OpenAI** - For AI research inspiration
- **Community Contributors** - For feedback and support

---

## 📞 Contact & Support

- **Website:** [vetra.com](https://vetra.com)
- **Email:** support@vetra.com
- **Discord:** [Join our community](https://discord.gg/vetra)
- **Twitter:** [@VetraAI](https://twitter.com/VetraAI)
- **Issues:** [GitHub Issues](https://github.com/vetra/vetra/issues)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vetra/vetra&type=Date)](https://star-history.com/#vetra/vetra&Date)

---

<div align="center">

**Built with ❤️ for the Solana ecosystem**

[⬆ Back to top](#-vetra---your-crypto-fraud-detector)

</div>
