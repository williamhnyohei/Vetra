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
- Content: F12 on page → Console (filtro “Vetra” / `__VETRA_HOOK__`)
- Interceptação na **página** (script inline / `injected.js`): console da **própria aba** (não do service worker)

### Interceptação e fluxo

- O content script publica `VETRA_TRANSACTION_REQUEST` (tipos legados `VETRA_TX_INTERCEPTED` e `VETRA_TRANSACTION_INTERCEPTED` também são aceitos) e o background chama `ANALYZE_TRANSACTION`.
- Na página: `window.__VETRA_HOOK__` pode ser `installed`, `failed`, `late_patched` ou `installed` com detalhe `already_present`.
- **Aguardar análise antes de assinar:** defina `VITE_VETRA_AWAIT_ANALYSIS=true` no `.env` (ou `.env.development`) e faça rebuild. Com isso, o bundle `injected.js` espera `VETRA_TRANSACTION_RESPONSE` antes de chamar a carteira (timeout 30s).

### Teste local sem Phantom

1. `pnpm run build`
2. Sirva a fixture: `npx http-server test/fixtures -p 8765` (ou use o `webServer` do Playwright ao rodar e2e).
3. Carregue a extensão em `chrome://extensions` a partir de `dist/`.
4. Abra `http://127.0.0.1:8765/wallet-mock.html`, aguarde o hook, clique em **Sign mock** e confira `__VETRA_HOOK__` e `__signCalls` no console.

### E2E (Playwright)

```bash
pnpm run test:e2e
```

Requer build (`dist/`) e Chromium do Playwright (`pnpm exec playwright install chromium` se necessário). O teste usa `ignoreDefaultArgs: ['--disable-extensions']` para que `--load-extension` funcione.

Se o ambiente bloquear o spawn do Chrome (`EPERM` em alguns sandboxes), o teste é **ignorado** automaticamente. Para forçar ignorar: `SKIP_PLAYWRIGHT_E2E=1 pnpm exec playwright test`.

### Checklist manual (Phantom)

1. Ordene extensões ou teste com só Vetra + Phantom.
2. Teste a fixture HTTP acima, depois um dapp real (ex.: Raydium em devnet).
3. Verifique os três consoles: página, content (às vezes no mesmo DevTools com “Content script”), service worker.

