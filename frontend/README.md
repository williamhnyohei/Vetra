# 🎨 Vetra Frontend

Chrome Extension (Manifest V3) para análise de risco de transações Solana.

## 📁 Estrutura

```
frontend/
├── extension/          # Chrome Extension (React + Vite + TypeScript)
│   ├── src/
│   │   ├── popup/     # Interface React (430x718px)
│   │   ├── background/# Service Worker (MV3)
│   │   ├── content/   # Content Script
│   │   ├── injected/  # Wrapper window.solana
│   │   ├── lib/       # Core logic (risk analyzer, Solana client)
│   │   ├── store/     # Zustand state management
│   │   ├── types/     # TypeScript types
│   │   └── styles/    # Global CSS + Tailwind
│   └── public/
│       └── manifest.json
│
└── assets/            # SVG icons e logos
    ├── logo.svg
    ├── icon-*.svg
    └── README.md
```

## 🚀 Quick Start

### Desenvolvimento

```bash
cd frontend/extension
pnpm install
pnpm dev
```

### Build

```bash
cd frontend/extension
pnpm build
```

### Carregar no Chrome

1. Abra `chrome://extensions/`
2. Ative "Modo do desenvolvedor"
3. Clique "Carregar sem compactação"
4. Selecione `frontend/extension/dist/`

## 🎨 Stack

- **Framework**: React 18.2
- **Language**: TypeScript 5.3
- **Build**: Vite 5.0
- **Styling**: TailwindCSS 3.3
- **State**: Zustand 4.4
- **Solana**: @solana/web3.js 1.87

## 📦 Estrutura da Extension

### Popup UI
- `popup/pages/Home.tsx` - Página principal com análise
- `popup/pages/History.tsx` - Histórico de transações
- `popup/pages/Settings.tsx` - Configurações do usuário

### Scripts
- `background/index.ts` - Service Worker (orquestração)
- `content/index.ts` - Content Script (bridge)
- `injected/index.ts` - Injected Script (window.solana wrapper)

### Core Logic
- `lib/risk-analyzer/` - Heurísticas de análise local
- `lib/solana/` - Cliente Solana e parsing
- `lib/attestations/` - Fetch de attestations on-chain

### State Management
- `store/transaction-store.ts` - Estado de transações
- `store/settings-store.ts` - Configurações persistentes

## 🎨 Design System

### Cores

```javascript
colors: {
  primary: '#FBB500',         // Dourado Vetra
  'primary-dark': '#E69B50',
  
  'dark-bg': '#121212',       // Background
  'dark-card': '#1E1E1E',     // Cards
  'dark-text': '#E6E6E6',     // Texto
  'dark-border': '#858C94',   // Bordas
  
  'risk-low': '#00D386',      // Verde (seguro)
  'risk-medium': '#F5A524',   // Amarelo (cuidado)
  'risk-high': '#AC1010',     // Vermelho (perigo)
}
```

### Ícones

Todos os ícones SVG estão em `frontend/assets/`:
- Status: `icon-success`, `icon-warning`, `icon-forbidden`
- Ação: `icon-play`, `icon-history`, `icon-lock`, etc.
- Botões: `button-back`, `button-favorite`

## 🧪 Comandos

```bash
# Desenvolvimento
pnpm dev                # Dev server com HMR
pnpm build              # Build para produção
pnpm preview            # Preview do build

# Qualidade
pnpm lint               # ESLint
pnpm type-check         # TypeScript check
pnpm test               # Vitest
pnpm test:e2e           # Playwright E2E

# Limpeza
pnpm clean              # Limpar build artifacts
```

## 📝 Convenções

### Componentes React

```tsx
// functional components com TypeScript
interface Props {
  transaction: Transaction;
}

function TransactionCard({ transaction }: Props) {
  return <div>...</div>;
}

export default TransactionCard;
```

### State Management

```tsx
import { useTransactionStore } from '@/store/transaction-store';

function MyComponent() {
  const { transactions, addTransaction } = useTransactionStore();
  // ...
}
```

### Styling

```tsx
// Use classes Tailwind
<div className="bg-dark-card rounded-lg p-4">
  <h2 className="text-primary font-bold">Title</h2>
</div>
```

## 🔧 Configuração

### Vite (vite.config.ts)

Build multi-entry para:
- `popup` - Interface React
- `background` - Service Worker
- `content` - Content Script
- `injected` - Injected Script

### Manifest V3

Permissions:
- `storage` - Salvar configurações
- `activeTab` - Tab atual
- `scripting` - Injetar scripts
- `host_permissions` - Todos os sites

## 🐛 Debug

### Popup
```
Right-click extension icon → "Inspect popup"
```

### Background
```
chrome://extensions/ → "service worker"
```

### Content Script
```
F12 on webpage → Console tab
```

## 📚 Próximos Passos

- [ ] Implementar risk analyzer completo
- [ ] Parser de transações Solana
- [ ] UI de aprovação de transação
- [ ] Fetch de attestations on-chain
- [ ] Histórico local (IndexedDB)
- [ ] Testes E2E completos

## 📖 Documentação

- [Extension README](extension/README.md) - Detalhes técnicos
- [ARCHITECTURE](../docs/ARCHITECTURE.md) - Arquitetura geral
- [DEVELOPMENT](../docs/DEVELOPMENT.md) - Guia de desenvolvimento

---

**Figma Design**: https://www.figma.com/design/JiMUat5vZNmV2lQ3Xcf16B/VETRA-IA

