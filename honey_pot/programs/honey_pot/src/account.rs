use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::*;

#[account]
#[derive(Default)]
pub struct GlobalPool {
    pub super_admin: Pubkey, // 32
}

#[account]
#[derive(Default)]
pub struct IdPool {
   pub player: Pubkey,                        //32
}

#[account(zero_copy)]
pub struct DailyPot {
    // 2_240_080
    pub count: u64,                            //8
    pub start_time: i64,                       //8
    pub prize: u64,                            //8
    pub end_time: i64,                         //8
    pub claim_prize: u64,                      //8
    pub winner: Pubkey,                        //32
}
#[account(zero_copy)]
pub struct WeeklyPot {
    // 22_400_080
    pub count: u64,                             //8
    pub start_time: i64,                        //8
    pub prize: u64,                             //8
    pub end_time: i64,                          //8
    pub claim_prize: u64,                       //8
    pub winner: Pubkey,                         //32
}
#[account(zero_copy)]
pub struct MonthlyPot {
    // 224_000_080
    pub count: u64,                              //8
    pub start_time: i64,                         //8
    pub prize: u64,                              //8
    pub end_time: i64,                           //8
    pub claim_prize: u64,                        //8
    pub winner: Pubkey,                          //32
}

impl Default for DailyPot {
    #[inline]
    fn default() -> DailyPot {
        DailyPot {
            count: 0,
            start_time: 0,
            prize: 0,
            end_time: 0,
            claim_prize: 0,
            winner: Pubkey::default(),
        }
    }
}
impl DailyPot {
    pub fn append(&mut self, buyer: Pubkey) {
        self.prize += DEPOSIT_VAULT;
        self.count += 1;
    }
    pub fn pre_update(&mut self, end_time: i64, claim: u64, winner: Pubkey) {
        self.end_time = end_time;
        self.claim_prize = claim;
        self.winner = winner;
    }
    pub fn update(&mut self, start_time: i64) {
        self.count = 0;
        self.prize = 0;
        self.start_time = start_time;
    }
}

impl Default for WeeklyPot {
    #[inline]
    fn default() -> WeeklyPot {
        WeeklyPot {
            count: 0,
            start_time: 0,
            prize: 0,
            end_time: 0,
            claim_prize: 0,
            winner: Pubkey::default(),
        }
    }
}
impl WeeklyPot {
    pub fn append(&mut self, buyer: Pubkey) {
        self.prize += DEPOSIT_VAULT;
        self.count += 1;
    }
    pub fn pre_update(&mut self, end_time: i64, claim: u64, winner: Pubkey) {
        self.end_time = end_time;
        self.claim_prize = claim;
        self.winner = winner;
    }
    pub fn update(&mut self, start_time: i64) {
        self.count = 0;
        self.prize = 0;
        self.start_time = start_time;
    }
}

impl Default for MonthlyPot {
    #[inline]
    fn default() -> MonthlyPot {
        MonthlyPot {
            count: 0,
            start_time: 0,
            prize: 0,
            end_time: 0,
            claim_prize: 0,
            winner: Pubkey::default(),
        }
    }
}
impl MonthlyPot {
    pub fn append(&mut self, buyer: Pubkey) {
        self.prize += DEPOSIT_VAULT;
        self.count += 1;
    }
    pub fn pre_update(&mut self, end_time: i64, claim: u64, winner: Pubkey) {
        self.end_time = end_time;
        self.claim_prize = claim;
        self.winner = winner;
    }
    pub fn update(&mut self, start_time: i64) {
        self.count = 0;
        self.prize = 0;
        self.start_time = start_time;
    }
}
