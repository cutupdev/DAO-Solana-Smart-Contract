# Honey_Pot_DAO
This is one kind of Lottery system.
Here's how it works:
- Players pay an entry fee of 0.05 $SOL for a golden ticket.
- 0.01 $SOL is taken from this fee and deposited into the community treasury 
- Players stake their golden ticket for the duration of the Pot.
- When the Pot ends, the wallet containing the winning ticket receives the contents of the pot.
- 10% of every pot is deposited into the community treasury. There are daily, weekly, and monthly pots.
- Over time, we will add pots with different ticket prices, time limits, and rules for entry

## Install Dependencies
- Install `node` and `yarn`
- Install `ts-node` as global command
- Confirm the solana wallet preparation: `/home/fury/.config/solana/id.json` in test case

## Usage
- Main script source for all functionality is here: `/cli/script.ts`
- Program account types are declared here: `/cli/types.ts`
- Idl to make the JS binding easy is here: `/cli/honey_pot.json`

Able to test the script functions working in this way.
- Change commands properly in the main functions of the `script.ts` file to call the other functions
- Confirm the `ANCHOR_WALLET` environment variable of the `ts-node` script in `package.json`
- Run `yarn ts-node`

## Features

### As a Smart Contract Owner
For the first time use, the Smart Contract Owner should `initialize` the Smart Contract for global account allocation.
- `initProject`

### As a user
All users can buy tickets by calling the functions 

```pub fn buy_tickets(ctx: Context<BuyTickets>, vault_bump: u8, amount: u64) -> ProgramResult ``` 

with amount of tickets.

After the lottery ends, they can reveal the winner by calling function 

``` pub fn reveal_winner(ctx: Context<RevealWinner>) -> ProgramResult ```.

Then, the winner can claim reward from the reward pool by calling funciton 

``` pub fn claim(ctx: Context<Claim>, vault_bump: u8) -> ProgramResult ```.

Above 3 functions are implemented for 3 pots- daily, weekly, and monthly pots.
