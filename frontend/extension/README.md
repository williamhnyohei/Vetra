# Vetra Extension

Chrome Extension (MV3) for Solana transaction risk analysis.

## Quick Start

```bash
pnpm install
pnpm dev
```

**Load in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `dist/`

## Structure

```
src/
├── popup/       # React UI
├── background/  # Service Worker
├── content/     # Content Script
├── injected/    # Injected (window.solana wrapper)
├── lib/         # Risk analyzer, Solana client
├── store/       # Zustand state
└── styles/      # TailwindCSS
```

## Scripts

```bash
pnpm dev         # Development (HMR)
pnpm build       # Production build
pnpm test        # Unit tests
pnpm lint        # ESLint
```

## Stack

React 18, TypeScript, Vite, TailwindCSS, Zustand, @solana/web3.js

## Debug

- Popup: Right-click icon → "Inspect popup"
- Background: `chrome://extensions/` → "service worker"
- Content: F12 on page → Console

