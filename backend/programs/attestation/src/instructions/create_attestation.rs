use anchor_lang::prelude::*;
use crate::state::{Attestation, SignalProvider};
use crate::errors::AttestationError;

#[derive(Accounts)]
#[instruction(transaction_hash: [u8; 32])]
pub struct CreateAttestation<'info> {
    #[account(mut)]
    pub provider_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"provider", provider_authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.stake >= SignalProvider::MIN_STAKE @ AttestationError::InsufficientStake
    )]
    pub provider: Account<'info, SignalProvider>,

    #[account(
        init,
        payer = provider_authority,
        space = 8 + Attestation::MAX_SIZE,
        seeds = [
            b"attestation",
            provider_authority.key().as_ref(),
            transaction_hash.as_ref()
        ],
        bump
    )]
    pub attestation: Account<'info, Attestation>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateAttestation>,
    transaction_hash: [u8; 32],
    risk_score: u8,
    reason: String,
) -> Result<()> {
    require!(risk_score <= 100, AttestationError::InvalidRiskScore);
    require!(reason.len() <= 200, AttestationError::ReasonTooLong);

    let attestation = &mut ctx.accounts.attestation;
    let provider = &mut ctx.accounts.provider;
    let clock = Clock::get()?;

    attestation.provider = ctx.accounts.provider_authority.key();
    attestation.transaction_hash = transaction_hash;
    attestation.risk_score = risk_score;
    attestation.reason = reason;
    attestation.created_at = clock.unix_timestamp;
    attestation.votes_for = 0;
    attestation.votes_against = 0;
    attestation.bump = ctx.bumps.attestation;

    // Update provider stats
    provider.attestations_count += 1;

    msg!("Attestation created for transaction: {:?}", transaction_hash);

    Ok(())
}

