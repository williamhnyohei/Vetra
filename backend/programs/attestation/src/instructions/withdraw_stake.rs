use anchor_lang::prelude::*;
use crate::state::SignalProvider;
use crate::errors::AttestationError;

#[derive(Accounts)]
pub struct WithdrawStake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"provider", authority.key().as_ref()],
        bump = provider.bump,
        constraint = provider.authority == authority.key() @ AttestationError::Unauthorized
    )]
    pub provider: Account<'info, SignalProvider>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawStake>, amount: u64) -> Result<()> {
    let provider = &mut ctx.accounts.provider;
    let clock = Clock::get()?;

    require!(
        provider.can_withdraw(clock.unix_timestamp),
        AttestationError::WithdrawCooldown
    );
    require!(provider.stake >= amount, AttestationError::InsufficientStake);

    let remaining_stake = provider.stake - amount;
    require!(
        remaining_stake >= SignalProvider::MIN_STAKE || remaining_stake == 0,
        AttestationError::InsufficientStake
    );

    // Transfer SOL back to authority
    **provider.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

    provider.stake -= amount;

    msg!("Withdrew {} lamports. Remaining stake: {}", amount, provider.stake);

    Ok(())
}

