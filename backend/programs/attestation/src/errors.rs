use anchor_lang::prelude::*;

#[error_code]
pub enum AttestationError {
    #[msg("Insufficient stake to create attestation")]
    InsufficientStake,
    
    #[msg("Risk score must be between 0 and 100")]
    InvalidRiskScore,
    
    #[msg("Reason text is too long (max 200 characters)")]
    ReasonTooLong,
    
    #[msg("Unauthorized operation")]
    Unauthorized,
    
    #[msg("Cannot withdraw during cooldown period")]
    WithdrawCooldown,
}

