use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod instructions;
pub mod state;
pub mod errors;

use instructions::*;

#[program]
pub mod attestation {
    use super::*;

    /// Create a new attestation for a transaction
    pub fn create_attestation(
        ctx: Context<CreateAttestation>,
        transaction_hash: [u8; 32],
        risk_score: u8,
        reason: String,
    ) -> Result<()> {
        instructions::create_attestation::handler(ctx, transaction_hash, risk_score, reason)
    }

    /// Stake SOL to build reputation as a signal provider
    pub fn stake_reputation(
        ctx: Context<StakeReputation>,
        amount: u64,
    ) -> Result<()> {
        instructions::stake_reputation::handler(ctx, amount)
    }

    /// Vote on an attestation's accuracy
    pub fn vote_attestation(
        ctx: Context<VoteAttestation>,
        is_accurate: bool,
    ) -> Result<()> {
        instructions::vote_attestation::handler(ctx, is_accurate)
    }

    /// Withdraw staked reputation (with cooldown period)
    pub fn withdraw_stake(
        ctx: Context<WithdrawStake>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_stake::handler(ctx, amount)
    }
}

