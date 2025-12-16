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

  /**
   * VIN:  {
  txid: 'f51b5e9f90f7bbd5bfa3a4a192aaf9a8fcbaf9479fd968ba9cc0e095ac763f61',
  vout: 178,
  prevout: {
    scriptpubkey: '76a9144411828e262d60eca412a22846c020002ff3859988ac',
    scriptpubkey_asm: 'OP_DUP OP_HASH160 OP_PUSHBYTES_20 4411828e262d60eca412a22846c020002ff38599 OP_EQUALVERIFY OP_CHECKSIG',
    scriptpubkey_type: 'p2pkh',
    scriptpubkey_address: '17CuvfEvyRDEJP8xhn9T9G1NWwtahPeBWk',
    value: 13494
  },
  scriptsig: '4830450221008b2ccabe90517ef2a715018182bd7f2ff4de33bd3c75c9fe6e229d9ed93303890220556635fafc0b0009a1d2c35558c9bb620a28931fb7dbdb2ec260b79d550663d8012103469afcf6df8dd911b27bea4e8cc030f42b9dd9980cd9de045c0c7a22841717c7',
  scriptsig_asm: 'OP_PUSHBYTES_72 30450221008b2ccabe90517ef2a715018182bd7f2ff4de33bd3c75c9fe6e229d9ed93303890220556635fafc0b0009a1d2c35558c9bb620a28931fb7dbdb2ec260b79d550663d801 OP_PUSHBYTES_33 03469afcf6df8dd911b27bea4e8cc030f42b9dd9980cd9de045c0c7a22841717c7',
  is_coinbase: false,
  sequence: 4294967293
}
   */
  let isCoinbase = false;
  // Extract input addresses
  for (const vin of tx.vin) {
    console.log('VIN: ', vin)
    if (vin.is_coinbase) {
      isCoinbase = true;
    }else if (vin.prevout && vin.prevout.scriptpubkey_address) {
      console.log('TX ID: ', vin.txid)
      console.log('VOUT: ', vin.vout)
      console.log('vin.prevout: ', vin.prevout)
      inputAddresses.push(vin.prevout.scriptpubkey_address);
    }
  }
  // TODO analyse individual transaction, one by one, not totals

  // Extract output addresses and values
  /**
   * VOUT:  {
  scriptpubkey: '76a914415b58d10e9a1e8ff12b0ac1ffb75ceb88f8e35388ac',
  scriptpubkey_asm: 'OP_DUP OP_HASH160 OP_PUSHBYTES_20 415b58d10e9a1e8ff12b0ac1ffb75ceb88f8e353 OP_EQUALVERIFY OP_CHECKSIG',
  scriptpubkey_type: 'p2pkh',
  scriptpubkey_address: '16xaMNCzbbogpWdsX3KW83mP5KnvvBGgrV',
  value: 12918
}
   */
  let totalOutputValue = 0;
  for (const vout of tx.vout) {
    console.log('VOUT: ', vout)
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
// API https://github.com/Blockstream/esplora/blob/master/API.md#transaction-format

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