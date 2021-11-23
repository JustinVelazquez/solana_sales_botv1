const solanaWeb3 = require('@solana/web3.js');
const { Connection, programs } = require('@metaplex/js');
const axios = require('axios');

if (!process.env.PROJECT_ADDRESS || !process.env.DISCORD_URL) {
  console.log('Please Set your Env variables!');
  return;
}

const projectPubKey = new solanaWeb3.PublicKey(process.env.PROJECT_ADDRESS);
const url = solanaWeb3.clusterApiUrl('mainnet-beta');
const solanaConnection = new solanaWeb3.Connection(url, 'confirmed');
const metaplexConnection = new Connection('mainnet-beta');
const {
  metadata: { metadata },
} = programs;
const pollingInterval = 2000; //ms

const marketplaceMap = {
  MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8: 'Magic Eden',
  HZaWndaNWHFDd9Dhk5pqUUtsmoBCqzb1MLu3NAh1VX6B: 'Alpha Art',
  '617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU': 'Solsea',
  CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz: 'Solanart',
  A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7: 'Digital Eyes',
};

const runSalesBot = async () => {
  console.log('starting sales bot...');

  let signatures;
  let lastKnownSignature;
  const options = {};
  while (true) {
    try {
      signatures = await solanaConnection.getSignaturesForAddress(
        projectPubKey,
        options
      );
      if (!signatures.length) {
        await timer(pollingInterval);
        continue;
      }
    } catch (err) {
      console.log('error fetching signatures', err);
      continue;
    }
  }

  //   for (let i = signatures.length - 1; i >= 0; i--)
};
