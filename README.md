# 🛡️ Vetra

**AI-powered Chrome Extension that protects you from Solana scams before you sign transactions**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-Blockchain-purple)](https://solana.com/)

## What is Vetra?

Vetra analyzes Solana transactions in real-time, protecting you from:
- 🚫 Rug pulls & honeypots
- 🎣 Phishing & malicious contracts  
- 🔓 Dangerous unlimited approvals
- 🕵️ Known scammer addresses

**Privacy-first:** Your wallet keys never leave your device.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start backend (Terminal 1)
cd backend
docker-compose up -d
npm run db:migrate
npm run dev

# Start extension (Terminal 2)
cd frontend/extension
pnpm dev
```

**Load in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `frontend/extension/dist`

## Project Structure

```
vetra/
├── frontend/extension/   # Chrome Extension (React + TypeScript)
├── backend/             # API (Node.js + Express + PostgreSQL)
└── programs/            # Solana on-chain program (Rust)
```

## Documentation

- 🏗️ [Architecture](docs/ARCHITECTURE.md)
- 🔧 [Development Guide](docs/DEVELOPMENT.md)
- 📡 [API Reference](backend/docs/MULTI_AGENT_API_SPEC.md)
- 🎨 [Figma Design](https://www.figma.com/design/JiMUat5vZNmV2lQ3Xcf16B/VETRA-IA)

## Tech Stack

**Frontend:** React 18, TypeScript, TailwindCSS, Vite  
**Backend:** Node.js 18, Express, PostgreSQL, Redis  
**Blockchain:** Solana, Anchor

## Contributing

See detailed setup instructions in:
- [Extension README](frontend/extension/README.md)
- [Backend README](backend/README.md)

## License

MIT - see [LICENSE](LICENSE)
