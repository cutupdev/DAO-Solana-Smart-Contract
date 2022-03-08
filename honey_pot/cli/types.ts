import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
    superAdmin: PublicKey,
}

export interface IdPool {
    player: PublicKey,
}

export interface DailyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}

export interface WeeklyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}

export interface MonthlyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}