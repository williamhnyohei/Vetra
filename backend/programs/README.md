# Vetra Attestation Program

Solana on-chain program for transaction risk attestations with reputation system.

## Overview

The attestation program allows signal providers to:
- Stake SOL to build reputation
- Create attestations for transactions
- Earn reputation through accurate predictions
- Community voting on attestation accuracy

## Program Structure

```
attestation/
├── src/
│   ├── lib.rs              # Program entry point
│   ├── instructions/       # Program instructions
│   │   ├── create_attestation.rs
│   │   ├── stake_reputation.rs
│   │   ├── vote_attestation.rs
│   │   └── withdraw_stake.rs
│   ├── state/             # Account structures
│   │   ├── attestation.rs
│   │   └── provider.rs
│   └── errors.rs          # Custom errors
└── tests/                 # Integration tests
```

## Quick Start

### Build

```bash
anchor build
```

### Test

```bash
# Start local validator
solana-test-validator

# Run tests
anchor test
```

### Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Instructions

### 1. Stake Reputation

Stake SOL to become a signal provider (minimum 1 SOL).

```rust
pub fn stake_reputation(
    ctx: Context<StakeReputation>,
    amount: u64,
) -> Result<()>
```

**Accounts:**
- `authority` - Signer, provider's wallet
- `provider` - PDA for provider state
- `system_program`

### 2. Create Attestation

Create a risk attestation for a transaction.

```rust
pub fn create_attestation(
    ctx: Context<CreateAttestation>,
    transaction_hash: [u8; 32],
    risk_score: u8,      // 0-100
    reason: String,      // Max 200 chars
) -> Result<()>
```

**Accounts:**
- `provider_authority` - Signer
- `provider` - Provider account (must have stake)
- `attestation` - New attestation PDA
- `system_program`

### 3. Vote on Attestation

Vote on whether an attestation was accurate.

```rust
pub fn vote_attestation(
    ctx: Context<VoteAttestation>,
    is_accurate: bool,
) -> Result<()>
```

Updates provider reputation based on accuracy.

### 4. Withdraw Stake

Withdraw staked SOL (7-day cooldown).

```rust
pub fn withdraw_stake(
    ctx: Context<WithdrawStake>,
    amount: u64,
) -> Result<()>
```

## Account Structures

### SignalProvider

```rust
pub struct SignalProvider {
    pub authority: Pubkey,           // Owner
    pub stake: u64,                  // Staked SOL
    pub reputation: u32,             // 0-1000
    pub attestations_count: u32,     // Total attestations
    pub accurate_attestations: u32,  // Accurate count
    pub last_stake_at: i64,          // Timestamp
    pub bump: u8,                    // PDA bump
}
```

### Attestation

```rust
pub struct Attestation {
    pub provider: Pubkey,            // Creator
    pub transaction_hash: [u8; 32],  // Transaction
    pub risk_score: u8,              // 0-100
    pub reason: String,              // Explanation
    pub created_at: i64,             // Timestamp
    pub votes_for: u32,              // Accurate votes
    pub votes_against: u32,          // Inaccurate votes
    pub bump: u8,                    // PDA bump
}
```

## PDAs

### Provider PDA

```
seeds = [b"provider", authority.key()]
```

### Attestation PDA

```
seeds = [
    b"attestation",
    provider_authority.key(),
    transaction_hash
]
```

## Reputation System

### Initial Reputation
New providers start with 500 reputation (neutral).

### Reputation Gains
- Accuracy > 70%: +1 reputation per vote
- Cap at 1000 reputation

### Reputation Losses
- Accuracy < 30%: -2 reputation per vote
- Minimum 0 reputation

### Staking Requirements
- Minimum stake: 1 SOL
- Withdraw cooldown: 7 days
- Must maintain minimum stake to create attestations

## Error Codes

```rust
pub enum AttestationError {
    InsufficientStake,      // Need more SOL
    InvalidRiskScore,       // Score must be 0-100
    ReasonTooLong,          // Max 200 chars
    Unauthorized,           // Not account owner
    WithdrawCooldown,       // Wait for cooldown
}
```

## Testing

### Unit Tests

```bash
cargo test
```

### Integration Tests

```bash
anchor test
```

### Test Coverage

```bash
cargo tarpaulin
```

## Example Usage

### TypeScript Client

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Attestation } from "../target/types/attestation";

// Initialize
const program = anchor.workspace.Attestation as Program<Attestation>;

// Stake reputation
await program.methods
  .stakeReputation(new anchor.BN(1_000_000_000)) // 1 SOL
  .accounts({
    authority: wallet.publicKey,
  })
  .rpc();

// Create attestation
const txHash = Buffer.from("..."); // 32 bytes
await program.methods
  .createAttestation(txHash, 85, "Token verified")
  .accounts({
    providerAuthority: wallet.publicKey,
  })
  .rpc();
```

## Deployment

### Devnet

```bash
solana config set --url devnet
anchor build
anchor deploy
```

### Mainnet

```bash
solana config set --url mainnet-beta
anchor build
anchor deploy --provider.cluster mainnet
```

## Security Considerations

1. **Cooldown Period**: 7-day withdrawal cooldown prevents gaming
2. **Minimum Stake**: 1 SOL requirement filters low-quality providers
3. **Reputation Decay**: Inaccurate attestations penalize reputation
4. **Community Voting**: Decentralized accuracy validation

## Gas Optimization

- Efficient account sizes (< 1KB)
- Minimal compute units
- Batch operations when possible

## Monitoring

```bash
# View program logs
solana logs <PROGRAM_ID>

# Check program account
solana account <PROGRAM_ID>

# View transaction
solana confirm -v <SIGNATURE>
```

---

**Program ID**: `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`  
**Anchor Version**: 0.29.0

