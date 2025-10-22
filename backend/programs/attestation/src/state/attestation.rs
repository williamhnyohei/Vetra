use anchor_lang::prelude::*;

#[account]
pub struct Attestation {
    /// Provider who created this attestation
    pub provider: Pubkey,
    
    /// Transaction hash being attested
    pub transaction_hash: [u8; 32],
    
    /// Risk score (0-100, higher is safer)
    pub risk_score: u8,
    
    /// Reason for the score (max 200 chars)
    pub reason: String,
    
    /// Timestamp when created
    pub created_at: i64,
    
    /// Votes for accuracy (positive votes)
    pub votes_for: u32,
    
    /// Votes against accuracy (negative votes)
    pub votes_against: u32,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl Attestation {
    pub const MAX_SIZE: usize = 32 + // provider
        32 + // transaction_hash
        1 + // risk_score
        4 + 200 + // reason (String with max 200 chars)
        8 + // created_at
        4 + // votes_for
        4 + // votes_against
        1; // bump

    pub fn accuracy_ratio(&self) -> f32 {
        let total = self.votes_for + self.votes_against;
        if total == 0 {
            return 0.5;
        }
        self.votes_for as f32 / total as f32
    }
}

