# Vetra Extension

Chrome Extension (Manifest V3) for assessing Solana transaction risks.

## Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Loading in Chrome

1. Build the extension: `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist/` folder

## Project Structure

```
src/
├── popup/          # React UI (430x718px)
├── background/     # Service Worker (MV3)
├── content/        # Content Script
├── injected/       # Injected Script (page context)
├── lib/           # Core logic
│   ├── risk-analyzer/
│   ├── solana/
│   └── attestations/
├── store/         # Zustand state
├── types/         # TypeScript definitions
└── styles/        # Global styles
```

## Features

- ✅ Intercepts Solana transactions
- ✅ Local risk analysis (privacy-first)
- ✅ Risk score visualization
- ✅ Transaction history
- ✅ On-chain attestations (optional)
- ✅ Configurable settings

## Development

### Hot Reload

The extension uses Vite with HMR. Changes to popup code will hot reload automatically. For background/content scripts, you'll need to reload the extension manually.

### Adding Components

```tsx
// src/popup/components/MyComponent.tsx
interface Props {
  // ...
}

function MyComponent({ }: Props) {
  return <div>...</div>;
}

export default MyComponent;
```

### State Management

Uses Zustand for state:

```tsx
import { useTransactionStore } from '@/store/transaction-store';

function MyComponent() {
  const { transactions, addTransaction } = useTransactionStore();
  // ...
}
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## Building for Production

```bash
pnpm build
```

Output will be in `dist/` folder ready for:
- Manual loading in Chrome
- Submission to Chrome Web Store
- Distribution as `.crx` file

## Scripts

- `dev` - Start development server
- `build` - Build for production
- `preview` - Preview production build
- `test` - Run unit tests
- `test:e2e` - Run E2E tests
- `lint` - Lint code
- `type-check` - Check TypeScript types

## Configuration

### Tailwind Colors

```js
colors: {
  primary: '#FBB500',    // Vetra gold
  'dark-bg': '#121212',  // Background
  'dark-card': '#1E1E1E', // Cards
  'risk-low': '#00D386',  // Green
  'risk-medium': '#F5A524', // Yellow
  'risk-high': '#AC1010',   // Red
}
```

### Manifest Permissions

- `storage` - Save settings and history
- `activeTab` - Access current tab
- `scripting` - Inject content scripts
- `host_permissions` - All URLs for Solana sites

## Troubleshooting

**Extension not loading:**
- Check manifest.json syntax
- Rebuild with `pnpm build`
- Check Chrome console for errors

**Transactions not intercepted:**
- Ensure content script is injecting
- Check page has `window.solana`
- Verify CSP allows extension scripts

**Build errors:**
- Clear `node_modules` and reinstall
- Check TypeScript errors: `pnpm type-check`
- Ensure Node.js 18+ is installed

