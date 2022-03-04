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

}

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
    let ix = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "daily-pot",
        newAccountPubkey: dailyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(DAY_POOL_SIZE),
        space: DAY_POOL_SIZE,
        programId: program.programId,
    });
    console.log(ix);
    let ix1 = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "weekly-pot",
        newAccountPubkey: weeklyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(WEEK_POOL_SIZE),
        space: WEEK_POOL_SIZE,
        programId: program.programId,
    });
    let ix2 = SystemProgram.createAccountWithSeed({
        fromPubkey: userAddress,
        basePubkey: userAddress,
        seed: "monthly-pot",
        newAccountPubkey: monthlyPotKey,
        lamports: await solConnection.getMinimumBalanceForRentExemption(MONTH_POOL_SIZE),
        space: MONTH_POOL_SIZE,
        programId: program.programId,
    });


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

export const buyTicket = async (
    userAddress: PublicKey,
    amount: number
) => {
  

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