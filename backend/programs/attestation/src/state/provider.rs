use anchor_lang::prelude::*;

#[account]
pub struct SignalProvider {
    /// Provider's public key
    pub authority: Pubkey,
    
    /// Total SOL staked
    pub stake: u64,
    
    /// Reputation score (0-1000)
    pub reputation: u32,
    
    /// Total attestations created
    pub attestations_count: u32,
    
    /// Accurate attestations (based on votes)
    pub accurate_attestations: u32,
    
    /// Last stake timestamp
    pub last_stake_at: i64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl SignalProvider {
    pub const MAX_SIZE: usize = 32 + // authority
        8 + // stake
        4 + // reputation
        4 + // attestations_count
        4 + // accurate_attestations
        8 + // last_stake_at
        1; // bump

    pub const MIN_STAKE: u64 = 1_000_000_000; // 1 SOL
    pub const WITHDRAW_COOLDOWN: i64 = 7 * 24 * 60 * 60; // 7 days

    pub fn accuracy_rate(&self) -> f32 {
        if self.attestations_count == 0 {
            return 0.0;
        }
        self.accurate_attestations as f32 / self.attestations_count as f32
    }

    pub fn can_withdraw(&self, current_time: i64) -> bool {
        current_time - self.last_stake_at >= Self::WITHDRAW_COOLDOWN
    }
}

