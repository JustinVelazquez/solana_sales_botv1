const solanaWeb3 = require('@solana/web3.js');
const { Connection, programs } = require('@metaplex/js');
const axios = require('axios');
const { Metadata } = require('@metaplex/js/lib/programs/metadata');

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

    for (let i = signatures.length - 1; i >= 0; i--) {
      try {
        let { signature } = signatures[i];
        const txn = await solanaConnection.getTransaction(signature);
        if (txn.meta && txn.meta.err != null) {
          continue;
        }

        const dateString = new Date(txn.blockTime * 1000).toLocaleString();
        const price =
          Math.abs(txn.meta.preBalances[0] - txn.meta.postBalances[0]) /
          solanaWeb3.LAMPORTS_PER_SOL;
        const accounts = txn.transaction.message.accountKeys;
        const marketplaceAccount = accounts[accounts.length - 1].toString();

        if (marketplaceMap[marketplaceAccount]) {
          const metadata = await getMetadata(
            txn.meta.postTokenBalances[0].mint
          );
          if (!metadata) {
            console.log('couldnt get metadata');
            continue;
          }

          printSalesInfo(
            dateString,
            price,
            signature,
            metadata.name,
            marketplaceMap[marketplaceAccount],
            metadata.image
          );
          await postSaleToDiscord(
            metadata.name,
            price,
            dateString,
            signature,
            metadata.image
          );
        } else {
          console.log('not a supported marketplace sale');
        }
      } catch (err) {
        console.log('error while going through signatures: ', err);
        continue;
      }
    }

    lastKnownSignature = signatures[0].signature;
    if (lastKnownSignature) {
      options.until = lastKnownSignature;
    }
  }
};
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const getMetadata = async (tokenPubKey) => {
  try {
    const addr = await Metadata.getPDA(tokenPubKey);
    const resp = await Metadata.load(metaplexConnection, addr);
    const { data } = await axios.get(resp.data.data.uri);
    return data;
  } catch (err) {
    console.log('error fetching metadata: ', err);
  }
};
