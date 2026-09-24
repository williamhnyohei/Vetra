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
# 1) Install monorepo deps
pnpm install

# 2) Backend infra + API (Terminal 1)
cd backend
docker-compose up -d postgres redis
cp .env.example .env   # or use the provided local .env
npm install
npm run db:migrate
npm run dev

# 3) Optional: Python MAS (Terminal 2)
cd vetra_mas
cp .env.example .env   # set GOOGLE_API_KEY
pip install -r requirements.txt
python -m uvicorn vetra_service:app --reload --host 0.0.0.0 --port 5000

# 4) Extension (Terminal 3)
cd frontend/extension
cp .env.example .env.development   # VITE_API_URL must end with /api
pnpm install
pnpm build   # or: pnpm dev
```

**Load in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `frontend/extension/dist`

**Start order:** Postgres/Redis → backend → (optional) MAS → extension build.

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
