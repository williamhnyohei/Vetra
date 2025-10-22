use anchor_lang::prelude::*;
use crate::state::{Attestation, SignalProvider};

#[derive(Accounts)]
pub struct VoteAttestation<'info> {
    pub voter: Signer<'info>,

    #[account(mut)]
    pub attestation: Account<'info, Attestation>,

    #[account(
        mut,
        seeds = [b"provider", attestation.provider.as_ref()],
        bump = provider.bump
    )]
    pub provider: Account<'info, SignalProvider>,
}

pub fn handler(ctx: Context<VoteAttestation>, is_accurate: bool) -> Result<()> {
    let attestation = &mut ctx.accounts.attestation;
    let provider = &mut ctx.accounts.provider;

    // Update vote counts
    if is_accurate {
        attestation.votes_for += 1;
    } else {
        attestation.votes_against += 1;
    }

    // Update provider reputation based on accuracy
    let accuracy_ratio = attestation.accuracy_ratio();
    
    if accuracy_ratio > 0.7 {
        // High accuracy - increase reputation
        if provider.reputation < 1000 {
            provider.reputation += 1;
        }
        provider.accurate_attestations += 1;
    } else if accuracy_ratio < 0.3 {
        // Low accuracy - decrease reputation
        if provider.reputation > 0 {
            provider.reputation = provider.reputation.saturating_sub(2);
        }
    }

    msg!(
        "Vote recorded. Accuracy: {:.2}%, Reputation: {}",
        accuracy_ratio * 100.0,
        provider.reputation
    );

    Ok(())
}

