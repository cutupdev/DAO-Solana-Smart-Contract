# Honey Pot DAO

Honey Pot DAO is a decentralized lottery system built on the Solana blockchain. The game allows players to enter lotteries by purchasing a "golden ticket," with a portion of the entry fees being allocated to a community treasury. The winner of each pot receives the accumulated funds, with a percentage of each pot being added to the treasury.

### How It Works:

- **Entry Fee**: Players pay 0.05 $SOL to purchase a golden ticket.
- **Treasury Contribution**: 0.01 $SOL from each entry fee is deposited into the community treasury.
- **Staking**: Players stake their golden ticket for the duration of the pot.
- **Lottery Draw**: At the end of the pot, the wallet holding the winning ticket receives the entire pot's contents.
- **Community Treasury**: 10% of every pot is added to the community treasury.
- **Pot Variations**: There are daily, weekly, and monthly pots. Over time, additional pots with varying ticket prices, time limits, and entry rules will be introduced.

## Installation

### Prerequisites

- **Node.js** and **Yarn** must be installed.
- Install `ts-node` globally for running TypeScript scripts.
- Ensure your Solana wallet is prepared, and the wallet’s configuration is located at `/home/fury/.config/solana/id.json`.

### Install Dependencies

Install the required dependencies using Yarn:

```bash
yarn install
```

### Usage

The main script for all functionality is located at:

```
/cli/script.ts
```

Program account types are defined in:

```
/cli/types.ts
```

The IDL for making JavaScript bindings easier is available here:

```
/cli/honey_pot.json
```

To test the script functions:

1. Modify the command functions in `script.ts` to call specific functions.
2. Confirm the `ANCHOR_WALLET` environment variable in the `package.json` for `ts-node`.
3. Run the script using:

```bash
yarn ts-node
```

## Features

### As a Smart Contract Owner

For the first-time setup, the smart contract owner must initialize the smart contract for global account allocation:

```typescript
initProject
```

### As a User

Users can interact with the lottery system by purchasing tickets and claiming rewards:

1. **Buy Tickets**: Users can buy tickets by calling the following function, specifying the number of tickets:

```typescript
pub fn buy_tickets(ctx: Context<BuyTickets>, vault_bump: u8, amount: u64) -> ProgramResult
```

2. **Reveal Winner**: After the lottery ends, the winner can be revealed by calling:

```typescript
pub fn reveal_winner(ctx: Context<RevealWinner>) -> ProgramResult
```

3. **Claim Reward**: The winner can claim their reward by calling the following function:

```typescript
pub fn claim(ctx: Context<Claim>, vault_bump: u8) -> ProgramResult
```

These functions are available for three different pots: daily, weekly, and monthly.

