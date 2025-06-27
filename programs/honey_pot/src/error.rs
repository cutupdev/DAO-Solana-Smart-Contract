use anchor_lang::prelude::*;

#[error]
pub enum PotError {
    // #[msg("Uninitialized account")]
    // Uninitialized,
    // #[msg("Invalid Super Owner")]
    // InvalidSuperOwner,
    #[msg("Invalid Player Pool Owner")]
    InvalidPlayerPool,
    #[msg("The Owner is not the Winner")]
    InvalidOwner,
    #[msg("The Owner is not last pot's Winner")]
    InvalidWinner,
    // #[msg("Invalid NFT Address")]
    // InvalidNFTAddress,
    // #[msg("Invalid Withdraw Time")]
    // InvalidWithdrawTime,
    #[msg("Insufficient Reward SOL Balance")]
    InsufficientRewardVault,
    #[msg("Insufficient PlayerRewardPool SOL Balance")]
    InsufficientPlayerVault,
}
