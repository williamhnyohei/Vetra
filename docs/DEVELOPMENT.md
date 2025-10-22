# Development Guide

## Prerequisites

### Required Software

```bash
# Node.js 18+
node --version  # v18.0.0+

# pnpm 8+
npm install -g pnpm
pnpm --version  # 8.0.0+

# Rust (latest stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version  # 1.17.0+

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
anchor --version  # 0.29.0
```

## Initial Setup

### 1. Clone & Install

```bash
git clone <repository-url>
cd vetra
pnpm install
```

### 2. Solana Setup

```bash
# Create wallet (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Set to devnet for development
solana config set --url devnet

# Airdrop SOL for testing
solana airdrop 2
```

### 3. Build Everything

```bash
# Build extension
pnpm build:extension

# Build Anchor programs
pnpm build:programs

# Or build everything
pnpm build
```

## Development Workflow

### Extension Development

```bash
# Start dev server with hot reload
cd extension
pnpm dev

# In another terminal, watch for changes
pnpm type-check --watch
```

**Load in Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/` folder

### Smart Contract Development

```bash
cd programs

# Start local validator
solana-test-validator

# In another terminal, build and deploy
anchor build
anchor deploy

# Run tests
anchor test
```

### Running Tests

```bash
# Extension unit tests
cd extension
pnpm test

# E2E tests
pnpm test:e2e

# Anchor tests
cd programs
anchor test
```

## Project Structure

```
vetra/
├── extension/          # Chrome Extension
│   ├── src/
│   │   ├── popup/     # React UI
│   │   ├── background/ # Service Worker
│   │   ├── content/   # Content Script
│   │   ├── injected/  # Page Context
│   │   ├── lib/       # Core logic
│   │   ├── store/     # State management
│   │   └── types/     # TypeScript types
│   └── public/        # Static assets
│
├── programs/          # Solana Programs
│   └── attestation/   # Anchor program
│       └── src/
│           ├── instructions/ # Program instructions
│           ├── state/        # Account structures
│           └── errors.rs     # Custom errors
│
├── packages/          # Shared packages
│   └── sdk/          # TypeScript SDK
│
└── docs/             # Documentation
```

## Coding Standards

### TypeScript

```typescript
// Use explicit types
function analyzeTransaction(tx: Transaction): RiskAnalysis {
  // ...
}

// Use const for immutable values
const MAX_RISK_SCORE = 100;

// Prefer async/await over promises
async function fetchAttestations(): Promise<Attestation[]> {
  const response = await fetch(url);
  return response.json();
}
```

### Rust

```rust
// Use descriptive names
pub struct SignalProvider {
    pub authority: Pubkey,
    pub stake: u64,
}

// Add documentation
/// Creates a new attestation for a transaction
pub fn create_attestation(/* ... */) -> Result<()> {
    // ...
}

// Use proper error handling
require!(score <= 100, AttestationError::InvalidRiskScore);
```

### React Components

```tsx
// Use functional components with TypeScript
interface Props {
  transaction: Transaction;
}

function TransactionCard({ transaction }: Props) {
  return (
    <div className="bg-dark-card p-4">
      {/* ... */}
    </div>
  );
}
```

## Git Workflow

### Branch Naming

- `feature/risk-analysis-engine`
- `fix/transaction-parsing-bug`
- `docs/update-architecture`

### Commit Messages

```
feat: add token verification heuristic
fix: resolve transaction parsing error
docs: update development guide
refactor: improve risk scoring algorithm
test: add unit tests for RiskAnalyzer
```

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Run linting: `pnpm lint`
4. Run tests: `pnpm test`
5. Create PR with description
6. Request review from team
7. Address feedback
8. Merge when approved

## Debugging

### Extension Debugging

```bash
# Chrome DevTools
1. Right-click extension icon → "Inspect popup"
2. chrome://extensions/ → "background page"
3. F12 on any webpage → "Console" tab for content script

# View logs
console.log('Debug message');
```

### Anchor Program Debugging

```bash
# View program logs
solana logs

# Get program account
solana account <ACCOUNT_PUBKEY>

# View transaction details
solana confirm -v <SIGNATURE>
```

### Common Issues

**Issue**: Extension not loading  
**Solution**: Check `manifest.json` syntax, rebuild with `pnpm build`

**Issue**: Anchor build fails  
**Solution**: Ensure Anchor version matches (0.29.0), run `cargo clean`

**Issue**: Transaction interception not working  
**Solution**: Check content script is injecting properly, verify CSP

## Performance Optimization

### Extension
- Keep bundle size < 1MB
- Use code splitting for large dependencies
- Lazy load components
- Cache RPC responses

### Anchor
- Minimize account sizes
- Use efficient data structures
- Batch transactions when possible
- Optimize compute units

## Useful Commands

```bash
# Format all code
pnpm format

# Lint and fix
pnpm lint --fix

# Clean build artifacts
pnpm clean

# Check types
pnpm type-check

# Update dependencies
pnpm update -r
```

## Resources

- [Anchor Book](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://react.dev/)

---

**Need help?** Open an issue or ask in the team chat!

