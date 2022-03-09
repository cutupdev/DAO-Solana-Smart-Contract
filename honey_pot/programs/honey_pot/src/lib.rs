use anchor_lang::{prelude::AccountInfo, prelude::*, AccountSerialize, System};

use solana_program::pubkey::Pubkey;

pub mod account;
pub mod constants;
pub mod error;
pub mod utils;

use account::*;
use constants::*;
use error::*;
use utils::*;

declare_id!("CKyZk5sDQ8hzap6STpCEgWhZC4a5dnnrTAv3pZNRQ98F");

#[program]
pub mod honey_pot {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, global_bump: u8, vault_bump: u8) -> ProgramResult {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        let mut daily_pot = ctx.accounts.daily_pot.load_init()?;
        let mut weekly_pot = ctx.accounts.weekly_pot.load_init()?;
        let mut monthly_pot = ctx.accounts.monthly_pot.load_init()?;
        Ok(())
    }

    pub fn initialize_id_pool(
        ctx: Context<InitializeIdPool>,
        id_bump: u8,
        timestamp: i64,
        identifier: u64,
    ) -> ProgramResult {
        let id_pool = &mut ctx.accounts.id_pool;
        id_pool.player = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn initialize_weekly_id_pool(
        ctx: Context<InitializeWeeklyIdPool>,
        id_bump: u8,
        timestamp: i64,
        identifier: u64,
    ) -> ProgramResult {
        let id_pool = &mut ctx.accounts.id_pool;
        id_pool.player = ctx.accounts.admin.key();
        Ok(())
    }

    pub fn initialize_monthly_id_pool(
        ctx: Context<InitializeMonthlyIdPool>,
        id_bump: u8,
        timestamp: i64,
        identifier: u64,
    ) -> ProgramResult {
        let id_pool = &mut ctx.accounts.id_pool;
        id_pool.player = ctx.accounts.admin.key();
        Ok(())
    }
    /**
     * @dev Buy the amount of daily tickets
     */
    pub fn buy_tickets(ctx: Context<BuyTickets>, vault_bump: u8, amount: u64) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut daily_pot = ctx.accounts.daily_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % DAY);

        if daily_pot.count == 0 {
            daily_pot.update(start_timestamp);
        }
        if start_timestamp != daily_pot.start_time {
            if start_timestamp != daily_pot.end_time {
                let (player_address, bump) = Pubkey::find_program_address(
                    &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                    &honey_pot::ID,
                );
                let char_vec: Vec<char> = player_address.to_string().chars().collect();
                let mut mul = 1;
                for i in 0..8 {
                    mul *= u64::from(char_vec[i as usize]);
                }
                let rand = mul % daily_pot.count;
                let claim_prize = daily_pot.prize;
                let time_seed = daily_pot.start_time;
                let (winner, bump) = Pubkey::find_program_address(
                    &[
                        DAILY_SEED.as_bytes(),
                        time_seed.to_string().as_bytes(),
                        rand.to_string().as_bytes(),
                    ],
                    &honey_pot::ID,
                );
                daily_pot.pre_update(start_timestamp, claim_prize, winner);
            }
            daily_pot.update(start_timestamp);
        }

        for _ in 0..amount {
            daily_pot.append(ctx.accounts.owner.key());
        }

        // Transfer 0.04SOL to the vault
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_VAULT,
        )?;

        // Transfer 0.01SOL to the Treasury wallet
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_TREASURY,
        )?;

        Ok(())
    }

    /**
     * @dev Buy the amount of weekly tickets
     */
    pub fn buy_weekly_tickets(
        ctx: Context<BuyWeeklyTickets>,
        vault_bump: u8,
        amount: u64,
    ) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut weekly_pot = ctx.accounts.weekly_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % WEEK);
        if weekly_pot.count == 0 {
            weekly_pot.update(start_timestamp);
        }

        if start_timestamp != weekly_pot.start_time {
            if start_timestamp != weekly_pot.end_time {
                let (player_address, bump) = Pubkey::find_program_address(
                    &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                    &honey_pot::ID,
                );
                let char_vec: Vec<char> = player_address.to_string().chars().collect();
                let mut mul = 1;
                for i in 0..8 {
                    mul *= u64::from(char_vec[i as usize]);
                }
                let rand = mul % weekly_pot.count;
                let claim_prize = weekly_pot.prize;
                let time_seed = weekly_pot.start_time;
                let (winner, bump) = Pubkey::find_program_address(
                    &[
                        WEEKLY_SEED.as_bytes(),
                        time_seed.to_string().as_bytes(),
                        rand.to_string().as_bytes(),
                    ],
                    &honey_pot::ID,
                );
                weekly_pot.pre_update(start_timestamp, claim_prize, winner);
            }
            weekly_pot.update(start_timestamp);
        }

        for _ in 0..amount {
            weekly_pot.append(ctx.accounts.owner.key());
        }

        // Transfer 0.04SOL to the vault
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_VAULT,
        )?;

        // Transfer 0.01SOL to the Treasury wallet
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_TREASURY,
        )?;

        Ok(())
    }

    /**
     * @dev Buy amount of monthly tickets
     */
    pub fn buy_monthly_tickets(
        ctx: Context<BuyMonthlyTickets>,
        vault_bump: u8,
        amount: u64,
    ) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut monthly_pot = ctx.accounts.monthly_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % MONTH);
        if monthly_pot.count == 0 {
            monthly_pot.update(start_timestamp);
        }

        if start_timestamp != monthly_pot.start_time {
            if start_timestamp != monthly_pot.end_time {
                let (player_address, bump) = Pubkey::find_program_address(
                    &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                    &honey_pot::ID,
                );
                let char_vec: Vec<char> = player_address.to_string().chars().collect();
                let mut mul = 1;
                for i in 0..8 {
                    mul *= u64::from(char_vec[i as usize]);
                }
                let rand = mul % monthly_pot.count;
                let claim_prize = monthly_pot.prize;
                let time_seed = monthly_pot.start_time;
                let (winner, bump) = Pubkey::find_program_address(
                    &[
                        MONTHLY_SEED.as_bytes(),
                        time_seed.to_string().as_bytes(),
                        rand.to_string().as_bytes(),
                    ],
                    &honey_pot::ID,
                );
                monthly_pot.pre_update(start_timestamp, claim_prize, winner);
            }
            monthly_pot.update(start_timestamp);
        }

        for _ in 0..amount {
            monthly_pot.append(ctx.accounts.owner.key());
        }

        // Transfer 0.04SOL to the vault
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_VAULT,
        )?;

        // Transfer 0.01SOL to the treasury wallet
        sol_transfer_user(
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            amount * DEPOSIT_TREASURY,
        )?;

        Ok(())
    }

    /**
     * @dev Reveal winner of the daily_pot
     */
    pub fn reveal_winner(ctx: Context<RevealWinner>) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut daily_pot = ctx.accounts.daily_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % DAY);
        if daily_pot.end_time == 0 {
            daily_pot.end_time = start_timestamp - DAY;
        }
        if start_timestamp == daily_pot.end_time {
            let (player_address, bump) = Pubkey::find_program_address(
                &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                &honey_pot::ID,
            );
            let char_vec: Vec<char> = player_address.to_string().chars().collect();
            let mut mul = 1;
            for i in 0..8 {
                mul *= u64::from(char_vec[i as usize]);
            }
            let rand = mul % daily_pot.count;
            let claim_prize = daily_pot.prize;
            let time_seed = daily_pot.start_time;
            let (winner, bump) = Pubkey::find_program_address(
                &[
                    DAILY_SEED.as_bytes(),
                    time_seed.to_string().as_bytes(),
                    rand.to_string().as_bytes(),
                ],
                &honey_pot::ID,
            );
            daily_pot.pre_update(start_timestamp, claim_prize, winner);
        }

        Ok(())
    }

    /**
     * @dev Reveal winner of the weekly_pot
     */
    pub fn reveal_weekly_winner(ctx: Context<RevealWeeklyWinner>) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut weekly_pot = ctx.accounts.weekly_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % WEEK);
        if weekly_pot.end_time == 0 {
            weekly_pot.end_time = start_timestamp - WEEK;
        }
        if start_timestamp != weekly_pot.end_time {
            let (player_address, bump) = Pubkey::find_program_address(
                &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                &honey_pot::ID,
            );
            let char_vec: Vec<char> = player_address.to_string().chars().collect();
            let mut mul = 1;
            for i in 0..8 {
                mul *= u64::from(char_vec[i as usize]);
            }
            let rand = mul % weekly_pot.count;
            let claim_prize = weekly_pot.prize;
            let time_seed = weekly_pot.start_time;
            let (winner, bump) = Pubkey::find_program_address(
                &[
                    WEEKLY_SEED.as_bytes(),
                    time_seed.to_string().as_bytes(),
                    rand.to_string().as_bytes(),
                ],
                &honey_pot::ID,
            );
            weekly_pot.pre_update(start_timestamp, claim_prize, winner);
        }

        Ok(())
    }

    /**
     * @dev Reveal winner of the monthly_pot
     */
    pub fn reveal_monthly_winner(ctx: Context<RevealMonthlyWinner>) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut monthly_pot = ctx.accounts.monthly_pot.load_mut()?;

        let start_timestamp = timestamp - (timestamp % MONTH);
        if monthly_pot.end_time == 0 {
            monthly_pot.end_time = start_timestamp - MONTH;
        }

        if start_timestamp != monthly_pot.end_time {
            let (player_address, bump) = Pubkey::find_program_address(
                &[RANDOM_SEED.as_bytes(), timestamp.to_string().as_bytes()],
                &honey_pot::ID,
            );
            let char_vec: Vec<char> = player_address.to_string().chars().collect();
            let mut mul = 1;
            for i in 0..8 {
                mul *= u64::from(char_vec[i as usize]);
            }
            let rand = mul % monthly_pot.count;
            let claim_prize = monthly_pot.prize;
            let time_seed = monthly_pot.start_time;
            let (winner, bump) = Pubkey::find_program_address(
                &[
                    MONTHLY_SEED.as_bytes(),
                    time_seed.to_string().as_bytes(),
                    rand.to_string().as_bytes(),
                ],
                &honey_pot::ID,
            );
            monthly_pot.pre_update(start_timestamp, claim_prize, winner);
        }

        Ok(())
    }

    /**
     * @dev Claim Prize from the vault only for winner
     */
    pub fn claim(ctx: Context<Claim>, vault_bump: u8) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut daily_pot = ctx.accounts.daily_pot.load_mut()?;

        require!(
            daily_pot.winner != ctx.accounts.owner.to_account_info().key(),
            PotError::InvalidOwner
        );

        let start_timestamp = timestamp - (timestamp % DAY);
        require!(
            daily_pot.end_time != start_timestamp,
            PotError::InvalidWinner
        );

        let prize = daily_pot.claim_prize * 90 / 100;
        let tax = daily_pot.claim_prize * 10 / 100;

        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            prize,
        )?;
        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            tax,
        )?;

        daily_pot.claim_prize = 0;
        daily_pot.winner = Pubkey::default();

        Ok(())
    }

    /**
     * @dev Claim Prize from the vault only for winner
     */
    pub fn claim_weekly(ctx: Context<ClaimWeekly>, vault_bump: u8) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut weekly_pot = ctx.accounts.weekly_pot.load_mut()?;

        require!(
            weekly_pot.winner != ctx.accounts.owner.to_account_info().key(),
            PotError::InvalidOwner
        );

        let start_timestamp = timestamp - (timestamp % DAY);
        require!(
            weekly_pot.end_time != start_timestamp,
            PotError::InvalidWinner
        );

        let prize = weekly_pot.claim_prize * 90 / 100;
        let tax = weekly_pot.claim_prize * 10 / 100;

        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            prize,
        )?;
        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            tax,
        )?;

        weekly_pot.claim_prize = 0;
        weekly_pot.winner = Pubkey::default();

        Ok(())
    }

    /**
     * @dev Claim Prize from the vault only for winner
     */
    pub fn claim_monthly(ctx: Context<ClaimMonthly>, vault_bump: u8) -> ProgramResult {
        let timestamp = Clock::get()?.unix_timestamp;
        let mut monthly_pot = ctx.accounts.monthly_pot.load_mut()?;

        require!(
            monthly_pot.winner != ctx.accounts.owner.to_account_info().key(),
            PotError::InvalidOwner
        );

        let start_timestamp = timestamp - (timestamp % DAY);
        require!(
            monthly_pot.end_time != start_timestamp,
            PotError::InvalidWinner
        );

        let prize = monthly_pot.claim_prize * 90 / 100;
        let tax = monthly_pot.claim_prize * 10 / 100;

        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            prize,
        )?;
        sol_transfer_with_signer(
            ctx.accounts.reward_vault.to_account_info(),
            ctx.accounts.treasury_wallet.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &[&[VAULT_AUTHORITY_SEED.as_ref(), &[vault_bump]]],
            tax,
        )?;

        monthly_pot.claim_prize = 0;
        monthly_pot.winner = Pubkey::default();

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(global_bump: u8, vault_bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump = global_bump,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,

    #[account(
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,

    #[account(zero)]
    pub daily_pot: AccountLoader<'info, DailyPot>,

    #[account(zero)]
    pub weekly_pot: AccountLoader<'info, WeeklyPot>,

    #[account(zero)]
    pub monthly_pot: AccountLoader<'info, MonthlyPot>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(id_bump: u8, timestamp: i64, identifier: u64)]
pub struct InitializeIdPool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [DAILY_SEED.as_ref(), timestamp.to_string().as_ref(), identifier.to_string().as_ref()],
        bump = id_bump,
        payer = admin
    )]
    pub id_pool: Account<'info, IdPool>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(id_bump: u8, timestamp: i64, identifier: u64)]
pub struct InitializeWeeklyIdPool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [WEEKLY_SEED.as_ref(), timestamp.to_string().as_ref(), identifier.to_string().as_ref()],
        bump = id_bump,
        payer = admin
    )]
    pub id_pool: Account<'info, IdPool>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(id_bump: u8, timestamp: i64, identifier: u64)]
pub struct InitializeMonthlyIdPool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [MONTHLY_SEED.as_ref(), timestamp.to_string().as_ref(), identifier.to_string().as_ref()],
        bump = id_bump,
        payer = admin
    )]
    pub id_pool: Account<'info, IdPool>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct BuyTickets<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub daily_pot: AccountLoader<'info, DailyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct BuyWeeklyTickets<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub weekly_pot: AccountLoader<'info, WeeklyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct BuyMonthlyTickets<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub monthly_pot: AccountLoader<'info, MonthlyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealWinner<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub daily_pot: AccountLoader<'info, DailyPot>,
}

#[derive(Accounts)]
pub struct RevealWeeklyWinner<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub weekly_pot: AccountLoader<'info, WeeklyPot>,
}

#[derive(Accounts)]
pub struct RevealMonthlyWinner<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub monthly_pot: AccountLoader<'info, MonthlyPot>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct Claim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub daily_pot: AccountLoader<'info, DailyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct ClaimWeekly<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub weekly_pot: AccountLoader<'info, WeeklyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(vault_bump: u8)]
pub struct ClaimMonthly<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub monthly_pot: AccountLoader<'info, MonthlyPot>,
    #[account(
        mut,
        seeds = [VAULT_AUTHORITY_SEED.as_ref()],
        bump = vault_bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = treasury_wallet.key() == TREASURY_WALLET.parse::<Pubkey>().unwrap(),
    )]
    pub treasury_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
