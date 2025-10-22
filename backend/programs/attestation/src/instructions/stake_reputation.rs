use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::SignalProvider;
use crate::errors::AttestationError;

#[derive(Accounts)]
pub struct StakeReputation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + SignalProvider::MAX_SIZE,
        seeds = [b"provider", authority.key().as_ref()],
        bump
    )]
    pub provider: Account<'info, SignalProvider>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakeReputation>, amount: u64) -> Result<()> {
    require!(amount >= SignalProvider::MIN_STAKE, AttestationError::InsufficientStake);

    let provider = &mut ctx.accounts.provider;
    let clock = Clock::get()?;

    // If new provider, initialize
    if provider.authority == Pubkey::default() {
        provider.authority = ctx.accounts.authority.key();
        provider.reputation = 500; // Start with neutral reputation
        provider.attestations_count = 0;
        provider.accurate_attestations = 0;
        provider.bump = ctx.bumps.provider;
    }

    // Transfer SOL to provider PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: provider.to_account_info(),
            },
        ),
        amount,
    )?;

    provider.stake += amount;
    provider.last_stake_at = clock.unix_timestamp;

    msg!("Staked {} lamports. Total stake: {}", amount, provider.stake);

    Ok(())
}

