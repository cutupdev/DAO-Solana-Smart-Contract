import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { HoneyPot } from '../target/types/honey_pot';

describe('honey_pot', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.HoneyPot as Program<HoneyPot>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
