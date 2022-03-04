import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface GlobalPool {
    admin: PublicKey,
}

export interface DailyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    entrants: PublicKey[],
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}

export interface WeeklyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    entrants: PublicKey[],
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}

export interface MonthlyPot {
    count: anchor.BN,
    startTime: anchor.BN,
    prize: anchor.BN,
    entrants: PublicKey[],
    endTime: anchor.BN,
    claimPrize: anchor.BN,
    winner: PublicKey,
}