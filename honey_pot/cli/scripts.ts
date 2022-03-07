import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, AccountLayout, MintLayout, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import fs from 'fs';
import { GlobalPool, DailyPot, WeeklyPot, MonthlyPot } from './types';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';

const DAY_POOL_SIZE = 424120;
const WEEK_POOL_SIZE = 40000;
const MONTH_POOL_SIZE = 50000;
const GLOBAL_AUTHORITY_SEED = "global-authority";
const REWARD_VAULT_SEED = "reward-vault";
const PROGRAM_ID = "GsDJ4KEj15GaC8ZyEDwBjMEfLC3CFCmJ2MsYeKoFfuM3";
const TREASURY_WALLET = "Fs8R7R6dP3B7mAJ6QmWZbomBRuTbiJyiR4QYjoxhLdPu";

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('devnet')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
console.log(payer.publicKey.toBase58());

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/.json", "utf8")
);

let rewardVault: PublicKey = null;
let program: Program = null;

// Address of the deployed program.
const programId = new anchor.web3.PublicKey(PROGRAM_ID);

// Generate the program client from IDL.
program = new anchor.Program(idl, programId);
console.log('ProgramId: ', program.programId.toBase58());

const main = async () => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    console.log('RewardVault: ', rewardVault.toBase58());

    await initProject(payer.publicKey);

    await buyTicket(payer.publicKey, 5);
    await buyTicket(new PublicKey("Fs8R7R6dP3B7mAJ6QmWZbomBRuTbiJyiR4QYjoxhLdPu"), 5);
    const dailyPot: DailyPot = await getDailyPot();
    console.log(dailyPot);

    // await revealWinner(payer.publicKey);
    // console.log(dailyPot);

    // await claim(payer.publicKey);

}

/**
 * @dev Before use this program, the accounts have to be initialized
 * @param userAddress : The caller who want to init the project
 * @returns 
 */
export const initProject = async (
    userAddress: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );

    let dailyPotKey = await PublicKey.createWithSeed(
        userAddress,
        "daily-pot",
        program.programId,
    );

    let weeklyPotKey = await PublicKey.createWithSeed(
        userAddress,
        "weekly-pot",
        program.programId,
    );

    let monthlyPotKey = await PublicKey.createWithSeed(
        userAddress,
        "monthly-pot",
        program.programId,
    );

    console.log(DAY_POOL_SIZE);

    // Create the daily_pot with seed
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "daily-pot",
        newAccountPubkey: dailyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(DAY_POOL_SIZE),
        space: DAY_POOL_SIZE,
        programId: program.programId,
    });

    // Create the weekly_pot with seed
    let ix1 = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "weekly-pot",
        newAccountPubkey: weeklyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(WEEK_POOL_SIZE),
        space: WEEK_POOL_SIZE,
        programId: program.programId,
    });

    // Create the monthly_pot with seed
    let ix2 = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "monthly-pot",
        newAccountPubkey: monthlyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(MONTH_POOL_SIZE),
        space: MONTH_POOL_SIZE,
        programId: program.programId,
    });

    // Call the initialize function of the program
    const tx = await program.rpc.initialize(
        bump, vaultBump, {
        accounts: {
            admin: payer.publicKey,
            globalAuthority,
            rewardVault: rewardVault,
            dailyPot: dailyPotKey,
            weeklyPot: weeklyPotKey,
            monthlyPot: monthlyPotKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [
            ix, ix1, ix2
        ],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("txHash =", tx);
    return false;
}

/**
 * @dev But daily tickets function
 * @param userAddress The caller of this function- the player of the game
 * @param amount The amount of tickets that the caller bought
 */
export const buyTicket = async (
    userAddress: PublicKey,
    amount: number
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.admin;

    let dailyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "daily-pot",
        program.programId,
    );

    const tx = await program.rpc.buyTicket(
        bump, vaultBump, new anchor.BN(amount), {
        accounts: {
            owner: userAddress,
            dailyPot: dailyPotKey,
            rewardVault: rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");
    console.log("The Number of Tickets You bought:", amount);

}

/**
 * @dev But Weekly tickets function
 * @param userAddress The caller of this function- the player of the game
 * @param amount The amount of tickets that the caller bought
 */
export const buyWeeklyTicket = async (
    userAddress: PublicKey,
    amount: number
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.admin;

    let weeklyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "weekly-pot",
        program.programId,
    );

    const tx = await program.rpc.buyWeeklyTicket(
        bump, vaultBump, new anchor.BN(amount), {
        accounts: {
            owner: userAddress,
            weeklyPot: weeklyPotKey,
            rewardVault: rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");
    console.log("The Number of Tickets You bought:", amount);
}

/**
 * @dev But Monthly tickets function
 * @param userAddress The caller of this function- the player of the game
 * @param amount The amount of tickets that the caller bought
 */
export const buyMonthlyTicket = async (
    userAddress: PublicKey,
    amount: number
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.admin;

    let monthlyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "monthly-pot",
        program.programId,
    );

    const tx = await program.rpc.buyMonthlyTicket(
        bump, vaultBump, new anchor.BN(amount), {
        accounts: {
            owner: userAddress,
            monthlyPot: monthlyPotKey,
            rewardVault: rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");
    console.log("The Number of Tickets You bought:", amount);
}


export const getGlobalState = async (
): Promise<GlobalPool | null> => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as GlobalPool;
    } catch {
        return null;
    }
}

/**
 * @dev get DailyPot data- count, startTime, prize, entrants[], endTime, claimPrize, winner
 * @returns DailyPot state
 */
export const getDailyPot = async (
): Promise<DailyPot | null> => {
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.admin;

    let dailyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "daily-pot",
        program.programId,
    );
    try {
        let dailyPot = await program.account.dailyPot.fetch(dailyPotKey);
        return dailyPot as DailyPot;
    } catch {
        return null;
    }
}
