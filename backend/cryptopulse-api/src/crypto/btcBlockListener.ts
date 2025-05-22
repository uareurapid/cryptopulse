import axios from "axios";

const API_BASE = "https://blockstream.info/api";
let lastBlockHash: string | null = null;

const SATOSHI_THRESHOLD = 100_000_000; // 1 BTC in satoshis

/**
 * Fetch the latest block hash.
 */
async function fetchLatestBlockHash(): Promise<string> {
  const response = await axios.get(`${API_BASE}/blocks/tip/hash`);
  return response.data;
}

/**
 * Fetch all transaction IDs in a block.
 */
async function fetchBlockTxids(hash: string): Promise<string[]> {
  const response = await axios.get(`${API_BASE}/block/${hash}/txids`);
  return response.data;
}

/**
 * Fetch full transaction details by txid.
 */
async function fetchTransaction(txid: string) {
  const response = await axios.get(`${API_BASE}/tx/${txid}`);
  return response.data;
}

/**
 * Inspect transaction details and print address activity.
 */
function inspectTransaction(tx: any) {
  const inputAddresses: string[] = [];
  const outputAddresses: { address: string; value: number }[] = [];

  let isCoinbase = false;
  // Extract input addresses
  for (const vin of tx.vin) {
    if (vin.is_coinbase) {
      isCoinbase = true;
    }else if (vin.prevout && vin.prevout.scriptpubkey_address) {
      inputAddresses.push(vin.prevout.scriptpubkey_address);
    }
  }
  // TODO analyse individual transaction, one by one, not totals

  // Extract output addresses and values
  let totalOutputValue = 0;
  for (const vout of tx.vout) {
    if (vout.scriptpubkey_address) {
      outputAddresses.push({ address: vout.scriptpubkey_address, value: vout.value });
      totalOutputValue += vout.value;
    }
  }

  // Only log transactions larger than 1 BTC
  if (totalOutputValue >= SATOSHI_THRESHOLD) {
    console.log(`💰 TX > 1 BTC: ${tx.txid}`);
    if (isCoinbase) {
      console.log(`   🧑‍🏭 Coinbase transaction - likely mining reward`);
    } 
    else {
        console.log(`   🔻 From: ${inputAddresses.join(", ") || "Unknown"}`);
    }
    console.log(`   🔺 To:`);
    for (const out of outputAddresses) {
      console.log(`      ➡️ ${out.address}: ${out.value / 1e8} BTC`);
    }
    console.log(`   💵 Total Output: ${totalOutputValue / 1e8} BTC\n`);
  }
}

/**
 * Polls for new blocks and processes transactions.
 */
async function pollNewBlocks(interval = 20000) {
  console.log("⏳ Starting Bitcoin block listener...");

  setInterval(async () => {
    try {
      const currentHash = await fetchLatestBlockHash();

      if (lastBlockHash && lastBlockHash !== currentHash || (!lastBlockHash)) {
        console.log(`🧱 New Block: ${currentHash}`);
        const txids = await fetchBlockTxids(currentHash);

        for (const txid of txids) {
          const tx = await fetchTransaction(txid);
          inspectTransaction(tx);
        }

        lastBlockHash = currentHash;
      }

    //   if (!lastBlockHash) {
    //     lastBlockHash = currentHash;
    //   }
    } catch (err) {
      console.error("⚠️ Error polling block:", err);
    }
  }, interval);
}

// Start the listener
export async function listenBTCNewBlocks() {
    return await pollNewBlocks() // every 20 seconds by default, keep rate low
}
/**
 
vin.prevout.scriptpubkey_address is used to extract sender addresses, but coinbase inputs won't have these.

tweak the SATOSHI_THRESHOLD value to adjust filtering.

A coinbase transaction is the first transaction in a block. It's special because it:

Creates new BTC as the block reward.

Does not have any inputs (i.e., no previous outputs to reference).

Instead, it has a vin entry with coinbase data (a message or extra nonce), not referencing any real prior UTXO.

cannot determine the “sender” of a coinbase transaction via vin.prevout.scriptpubkey_address because:
There is no sender in the traditional sense.

The reward is simply created and assigned to a mining pool's payout address.

How to Handle Coinbase Transactions Properly

do not read sender addresses from vin.

Treat output addresses as the recipients of the newly minted BTC.

Log that it's a coinbase transaction (for clarity and auditing).
*/