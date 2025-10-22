# Vetra Architecture

## Overview

Vetra is a Chrome Extension (Manifest V3) that provides real-time risk assessment for Solana transactions before they are signed. It combines local heuristic analysis with optional on-chain attestations from trusted signal providers.

## System Components

### 1. Chrome Extension Layer

#### **Popup UI (React + Tailwind)**
- Dimensions: 430x718px
- Dark theme (#121212 background)
- Pages: Home, History, Settings
- Components: RiskScore, TransactionCard, AttestationsList

#### **Background Service Worker (MV3)**
- Orchestrates communication between components
- Manages persistent state
- Handles RPC calls to Solana network
- Coordinates risk analysis

#### **Content Script**
- Injected into all web pages
- Bridges between page context and extension
- Forwards transaction requests for analysis

#### **Injected Script**
- Runs in page context (access to `window.solana`)
- Wraps Solana provider methods
- Intercepts `signTransaction` and `signAllTransactions`
- Privacy-preserving by default

### 2. Risk Analysis Engine

Local heuristics analyze transactions without external calls:

- **Token Verification**: Check if token is known/verified
- **Program Analysis**: Validate program IDs
- **Account Reputation**: Assess counterparty reputation
- **Amount Analysis**: Flag unusual transaction amounts
- **Pattern Recognition**: Detect common scam patterns

**Score Calculation (0-100):**
- 70-100: Low Risk (Green)
- 40-69: Medium Risk (Yellow)
- 0-39: High Risk (Red)

### 3. Attestation Layer (On-Chain)

**Anchor Program**: `attestation`

Provides decentralized reputation system for signal providers:

```
SignalProvider
├── Stake SOL (min 1 SOL)
├── Create Attestations
├── Earn Reputation (0-1000)
└── Withdraw (7-day cooldown)

Attestation
├── Transaction Hash
├── Risk Score (0-100)
├── Reason (max 200 chars)
├── Votes (For/Against)
└── Accuracy Tracking
```

## Data Flow

```
User Action on Website
    ↓
window.solana.signTransaction()
    ↓
Injected Script (intercept)
    ↓
Content Script (bridge)
    ↓
Background Service Worker
    ↓
┌───────────────────┼───────────────────┐
│                   │                   │
Risk Engine      Solana RPC      Popup UI
(local)         (network)       (display)
    │                   │                   │
    └───────────────────┴───────────────────┘
                      │
              User Approval/Rejection
```

## Security Model

### Privacy First
- **Default**: All analysis runs locally
- **No tracking**: No user data leaves device
- **Optional**: On-chain attestations (user opt-in)

### Threat Model
- **Phishing sites**: Detect fake token mints
- **Malicious programs**: Whitelist known programs
- **Social engineering**: Flag suspicious patterns
- **Rug pulls**: Track token creation dates

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **TailwindCSS**: Styling
- **Zustand**: State management

### Smart Contracts
- **Anchor 0.29.0**: Solana framework
- **Rust**: Program language
- **Solana Web3.js**: Client SDK

### Development
- **pnpm**: Package manager (workspaces)
- **ESLint/Prettier**: Code quality
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## Deployment

### Extension
1. Build: `pnpm build:extension`
2. Output: `extension/dist/`
3. Load in Chrome: Developer Mode → Load unpacked

### Smart Contracts
1. Build: `anchor build`
2. Test: `anchor test`
3. Deploy:
   - Devnet: `pnpm deploy:devnet`
   - Mainnet: `pnpm deploy:mainnet`

## Scalability

- **Client-side**: No backend required
- **On-chain**: Anchor program handles unlimited attestations
- **Storage**: Local IndexedDB for transaction history
- **Performance**: < 100ms analysis time

## Future Enhancements

1. **ML-based risk scoring**: Train on historical scams
2. **Community signals**: Aggregate attestations
3. **Cross-chain**: Extend to other chains
4. **Mobile**: React Native version
5. **API**: Expose risk API for wallets

---

**Version**: 0.1.0  
**Last Updated**: October 2025

