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

// Const Poolsize
const DAY_POOL_SIZE = 80;
const WEEK_POOL_SIZE = 80;
const MONTH_POOL_SIZE = 80;

// Const SEEDs
const GLOBAL_AUTHORITY_SEED = "global-authority";
const REWARD_VAULT_SEED = "vault-authority";
const DAILY_SEED = "daily-pot";
const WEEKLY_SEED = "weekly-pot";
const MONTHLY_SEED = "monthly-pot";

// Publickeys
const PROGRAM_ID = "CKyZk5sDQ8hzap6STpCEgWhZC4a5dnnrTAv3pZNRQ98F";
const TREASURY_WALLET = "Fs8R7R6dP3B7mAJ6QmWZbomBRuTbiJyiR4QYjoxhLdPu";

anchor.setProvider(anchor.Provider.local(web3.clusterApiUrl('devnet')));
const solConnection = anchor.getProvider().connection;
const payer = anchor.getProvider().wallet;
console.log(payer.publicKey.toBase58());

const idl = JSON.parse(
    fs.readFileSync(__dirname + "/honey_pot.json", "utf8")
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

    // await initProject(payer.publicKey);

    // await buyTicket(payer.publicKey, 5);
    // await buyWeeklyTicket(payer.publicKey, 3);
    await buyMonthlyTicket(payer.publicKey, 3);
    // await buyTicket(new PublicKey("Fs8R7R6dP3B7mAJ6QmWZbomBRuTbiJyiR4QYjoxhLdPu"), 5);
    // const dailyPot: DailyPot = await getDailyPot();
    // console.log(dailyPot);

    // await revealWinner(payer.publicKey);
    // console.log(dailyPot);

    // await claim(payer.publicKey);

};

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

    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

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
 * @dev Create account of users with the identifier, timestamp, seed
 * @param userAddress The caller of this function - the player of the game
 * @param identifier The count of the dailyPot
 * @param timestamp The startTime of the dailyPot
 */
export const initIdPool = async (
    userAddress: PublicKey,
    identifier: number,
    timestamp: number,
) => {
    const [idAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(DAILY_SEED), Buffer.from(timestamp.toString()), Buffer.from(identifier.toString())],
        program.programId
    );

    const tx = await program.rpc.initializeIdPool(
        bump, new anchor.BN(timestamp), new anchor.BN(identifier), {
        accounts: {
            admin: userAddress,
            idPool: idAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The ID Pool is Successfully Initialized`);
}

/**
 * @dev Create account of users with the identifier, timestamp, seed
 * @param userAddress The caller of this function - the player of the game
 * @param identifier The count of the dailyPot
 * @param timestamp The startTime of the dailyPot
 */
export const initWeeklyIdPool = async (
    userAddress: PublicKey,
    identifier: number,
    timestamp: number,
) => {
    const [idAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(WEEKLY_SEED), Buffer.from(timestamp.toString()), Buffer.from(identifier.toString())],
        program.programId
    );

    const tx = await program.rpc.initializeWeeklyIdPool(
        bump, new anchor.BN(timestamp), new anchor.BN(identifier), {
        accounts: {
            admin: userAddress,
            idPool: idAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The ID Pool is Successfully Initialized`);
}

/**
 * @dev Create account of users with the identifier, timestamp, seed
 * @param userAddress The caller of this function - the player of the game
 * @param identifier The count of the dailyPot
 * @param timestamp The startTime of the dailyPot
 */
export const initMonthlyIdPool = async (
    userAddress: PublicKey,
    identifier: number,
    timestamp: number,
) => {
    const [idAddress, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(MONTHLY_SEED), Buffer.from(timestamp.toString()), Buffer.from(identifier.toString())],
        program.programId
    );

    const tx = await program.rpc.initializeMonthlyIdPool(
        bump, new anchor.BN(timestamp), new anchor.BN(identifier), {
        accounts: {
            admin: userAddress,
            idPool: idAddress,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The ID Pool is Successfully Initialized`);
}

/**
 * @dev Buy daily tickets function
 * @param userAddress The caller of this function- the player of the game
 * @param amount The amount of tickets that the caller bought
 */
export const buyTicket = async (
    userAddress: PublicKey,
    amount: number
) => {

    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let dailyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "daily-pot",
        program.programId,
    );

    console.log("---------------------");
    const dailyPot: DailyPot = await getDailyPot();
    const timestamp = dailyPot.startTime.toNumber();
    let identifier = dailyPot.count.toNumber();
    for (var _identifier = identifier; _identifier < identifier + amount; _identifier++) {
        await initIdPool(userAddress, _identifier, timestamp);
    }

    console.log("---------------------");

    const tx = await program.rpc.buyTickets(
        vaultBump, new anchor.BN(amount), {
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
 * @dev Buy Weekly tickets function
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
    const adminAddress = globalPool.superAdmin;

    let weeklyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "weekly-pot",
        program.programId,
    );

    const weeklyPot: WeeklyPot = await getWeeklyPot();
    const timestamp = weeklyPot.startTime.toNumber();
    let identifier = weeklyPot.count.toNumber();
    for (var _identifier = identifier; _identifier < identifier + amount; _identifier++) {
        await initWeeklyIdPool(userAddress, _identifier, timestamp);
    }

    const tx = await program.rpc.buyWeeklyTickets(
        vaultBump, new anchor.BN(amount), {
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
 * @dev Buy Monthly tickets function
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
    const adminAddress = globalPool.superAdmin;

    let monthlyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "monthly-pot",
        program.programId,
    );

    const monthlyPot: MonthlyPot = await getMonthlyPot();
    const timestamp = monthlyPot.startTime.toNumber();
    let identifier = monthlyPot.count.toNumber();
    for (var _identifier = identifier; _identifier < identifier + amount; _identifier++) {
        await initMonthlyIdPool(userAddress, _identifier, timestamp);
    }

    const tx = await program.rpc.buyMonthlyTickets(
        vaultBump, new anchor.BN(amount), {
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

/**
 * @dev The function which can reveal the winner of the daily_pot
 * @param userAddress The caller address
 */
export const revealWinner = async (
    userAddress: PublicKey,
) => {

    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let dailyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "daily-pot",
        program.programId,
    );
    const tx = await program.rpc.revealWinner(
        {
            accounts: {
                owner: userAddress,
                dailyPot: dailyPotKey,
            },
            instructions: [],
            signers: [],
        });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("Reveal Daily Winner Succeed");

}

/**
 * @dev The function which can reveal the winner of the weekly_pot
 * @param userAddress The caller address
 */
export const revealWeeklyWinner = async (
    userAddress: PublicKey,
) => {

    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let weeklyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "weekly-pot",
        program.programId,
    );
    const tx = await program.rpc.revealWeeklyWinner(
        {
            accounts: {
                owner: userAddress,
                weeklyPot: weeklyPotKey,
            },
            instructions: [],
            signers: [],
        });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("Reveal Weekly Winner Succeed");
}

/**
 * @dev The function which can reveal the winner of the monthly_pot
 * @param userAddress The caller address
 */

export const revealMonthlyWinner = async (
    userAddress: PublicKey,
) => {

    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let monthlyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "monthly-pot",
        program.programId,
    );
    const tx = await program.rpc.revealMonthlyWinner(
        {
            accounts: {
                owner: userAddress,
                monthlyPot: monthlyPotKey,
            },
            instructions: [],
            signers: [],
        });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log("Reveal Monthly Winner Succeed");
}

/**
 * @dev The claim funtion that can claim the winner Prize from the daily_pot
 * @param userAddress The caller address to claim reward from the rewardVault
 */
export const claim = async (
    userAddress: PublicKey,
) => {
    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;
    const dailyPot: DailyPot = await getDailyPot();
    const claimPrize = dailyPot.claimPrize;

    console.log(claimPrize.toNumber());

    let dailyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "daily-pot",
        program.programId,
    );
    const tx = await program.rpc.claim(
        vaultBump, {
        accounts: {
            owner: userAddress,
            dailyPot: dailyPotKey,
            rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The Winner ${userAddress.toBase58()} Claimed ${claimPrize.toNumber()} Successfully`);

}

/**
 * @dev The claim funtion that can claim the winner Prize from the weekly_pot
 * @param userAddress The caller address to claim reward from the rewardVault
 */
export const claimWeekly = async (
    userAddress: PublicKey,
) => {
    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;
    const weeklyPot: WeeklyPot = await getWeeklyPot();
    const claimPrize = weeklyPot.claimPrize;

    console.log(claimPrize);

    let weeklyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "weekly-pot",
        program.programId,
    );
    const tx = await program.rpc.claimWeekly(
        vaultBump, {
        accounts: {
            owner: userAddress,
            weeklyPot: weeklyPotKey,
            rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The Winner ${userAddress.toBase58()} Claimed ${claimPrize.toNumber()} Successfully`);

}

/**
 * @dev The claim funtion that can claim the winner Prize from the monthy_pot
 * @param userAddress The caller address to claim reward from the rewardVault
 */
export const claimMonthly = async (
    userAddress: PublicKey,
) => {
    const [rewardVault, vaultBump] = await PublicKey.findProgramAddress(
        [Buffer.from(REWARD_VAULT_SEED)],
        program.programId
    );
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;
    const monthlyPot: MonthlyPot = await getMonthlyPot();
    const claimPrize = monthlyPot.claimPrize;

    console.log(claimPrize);

    let monthlyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "monthly-pot",
        program.programId,
    );
    const tx = await program.rpc.claimMonthly(
        vaultBump, {
        accounts: {
            owner: userAddress,
            monthlyPot: monthlyPotKey,
            rewardVault,
            treasuryWallet: new PublicKey(TREASURY_WALLET),
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    });
    await solConnection.confirmTransaction(tx, "confirmed");

    console.log(`The Winner ${userAddress.toBase58()} Claimed ${claimPrize.toNumber()} Successfully`);

}

/**
 * @dev get GlobalPool data- admin address of the globalpool
 * @returns GlobalPool state
 */
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
    const adminAddress = globalPool.superAdmin;

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

/**
 * @dev get WeeklyPot data- count, startTime, prize, entrants[], endTime, claimPrize, winner
 * @returns WeeklyPot state
 */
export const getWeeklyPot = async (
): Promise<WeeklyPot | null> => {
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let weeklyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "weekly-pot",
        program.programId,
    );
    try {
        let weeklyPot = await program.account.weeklyPot.fetch(weeklyPotKey);
        return weeklyPot as WeeklyPot;
    } catch {
        return null;
    }
}

/**
 * @dev get MonthyPot data- count, startTime, prize, entrants[], endTime, claimPrize, winner
 * @returns MonthlyPot state
 */
export const getMonthlyPot = async (
): Promise<MonthlyPot | null> => {
    const globalPool: GlobalPool = await getGlobalState();
    const adminAddress = globalPool.superAdmin;

    let monthlyPotKey = await PublicKey.createWithSeed(
        adminAddress,
        "monthly-pot",
        program.programId,
    );
    try {
        let monthlyPot = await program.account.monthlyPot.fetch(monthlyPotKey);
        return monthlyPot as MonthlyPot;
    } catch {
        return null;
    }
}

main();