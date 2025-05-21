var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parentPort, workerData } from 'worker_threads';
import { BlockchainTracking } from './blockchainTracking.js';
import { ERC20TransactionType, ERC20TransferDirection } from '../models/ERC20TransferHistory.js';
import { ethers, Interface, ZeroAddress } from 'ethers';
import { CRAWLING_MESSAGES, EVENT_HASHES, START_TRACKING_EVENTS, TRANSACTION_EVENTS } from '../utils/Constants.js';
import { getDefaultChunkSize, getNetworkHeight } from '../utils/util.js';
import ERC20ABI from '../utils/ERC20ABI.json' assert { type: 'json' };
import { getCrawlingInterval, retryCrawlerWithDelay } from './trackingUtils.js';
import { getExistingToken, updateExistingTokenBlock, updateTokenTrackingDataWithTransferData } from '../tokens/service.js';
import { TOKENS_LOGGER } from '../logging/common.js';
let counter = 0;
const crawlingInterval = process.env.INDEXING_INTERVAL ? Number(process.env.INDEXING_INTERVAL) : 20000;
const { userId, trackingData, rpcDetails } = workerData;
let startedCrawling = false;
let stoppedCrawling = false;
let token;
parentPort === null || parentPort === void 0 ? void 0 : parentPort.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.method === START_TRACKING_EVENTS.START_TRACKING_TOKEN) {
        try {
            token = yield getExistingToken(userId, trackingData.token, trackingData.network);
        }
        catch (error) {
            console.log('Unable to get token: ', trackingData.token);
            // TODO ABORT?
        }
        // start indexing the chain
        const blockchain = new BlockchainTracking(rpcDetails.rpc, rpcDetails.network.chainName, rpcDetails.network.chainId, rpcDetails.fallbackRPCs);
        const isReady = yield (yield blockchain.isNetworkReady()).ready;
        // arrayOfListeners.push(blockChainHandler)
        if (isReady) {
            processNetworkData(blockchain, blockchain.getSigner());
        }
        else {
            const canStart = yield retryCrawlerWithDelay(blockchain);
            if (canStart) {
                processNetworkData(blockchain, blockchain.getSigner());
            }
        }
    }
}));
/**
 * Get the last indexed block for a specific wallet
 * @param user user id
 * @param tokenAddress token address
 * @param chain network name
 * @returns last block indexed for this wallet or -1
 */
function getLastIndexedBlock(user, tokenAddress, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getExistingToken(user, tokenAddress, chain);
        if (token) {
            return token.last_block ? token.last_block : -1;
        }
        return -1;
    });
}
export function processNetworkData(tracker, 
// provider: JsonRpcApiProvider,
signer) {
    return __awaiter(this, void 0, void 0, function* () {
        // isolate provider
        const provider = tracker.getProvider();
        // wallet to track
        const token = trackingData.token;
        // network
        const network = trackingData.network;
        let startBlock = trackingData.start_block || 0;
        // TODO check this
        // it should be set to the network height as default, if < 0
        // if(startBlock < 0) {
        //   startBlock = await getNetworkHeight(provider)
        //   trackingData.startBlock = startBlock
        // }
        // last indexed block for this wallet (from DB)
        let lastIndexedBlock = yield getLastIndexedBlock(userId, token, network); // trackingData.lastBlock || 0 // save on DB network -> last block processed for this wallet
        // const isLocalChain = rpcDetails.network.chainId === DEVELOPMENT_CHAIN_ID
        // if (isLocalChain) {
        //   // rpcDetails.startBlock = 0
        //   console.log('Cannot get block info for local network, starting from block 0')
        // }
        // if we defined a valid startBlock use it, oterwise start from deployed one
        let crawlingStartBlock = startBlock;
        // if the one defined on the wallet is lower than the last one from DB, use the one from DB instead
        if (lastIndexedBlock > startBlock) {
            // we start at the last indexed one + 1
            crawlingStartBlock = lastIndexedBlock + 1;
        }
        console.log(`RPC crawling details => Wallet address: ${token}, lastIndexedBlock: ${lastIndexedBlock}, Crawling start block: ${crawlingStartBlock}`);
        // we can override the default value of 30 secs, by setting process.env.INDEXER_INTERVAL
        let interval = getCrawlingInterval();
        let chunkSize = rpcDetails.chunkSize ? rpcDetails.chunkSize : 100; // parse 100 blocks at the time
        let lockProccessing = false;
        // let lastIndexedBlock = 0 // null // await getLastIndexedBlock()
        let currentBlock = 0;
        const doCrawl = function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (!lockProccessing) {
                    lockProccessing = true;
                    // get the network last block
                    const currentNetworkHeight = yield getNetworkHeight(provider);
                    if (lastIndexedBlock > currentNetworkHeight) {
                        console.error(`BIG ERROR: lastIndexedBlock: ${lastIndexedBlock} , currentNetworkHeight: ${currentNetworkHeight} `);
                    }
                    // now check again (lastIndexedBlock is getting updated on each pass)
                    const startBlock = lastIndexedBlock > crawlingStartBlock ? lastIndexedBlock : crawlingStartBlock;
                    console.log(`Indexing network '${rpcDetails.network.chainName}', Token: ${token} , Last indexed block: ${lastIndexedBlock}, Start block: ${startBlock}, Network height: ${currentNetworkHeight}`);
                    // Only do processing if we have more blocks than the last one we indexed (indexed means parsed and saved on DB)
                    if (currentNetworkHeight >= startBlock && lastIndexedBlock < currentNetworkHeight) {
                        // emit an one shot event when we actually start the crawling process
                        if (!startedCrawling) {
                            startedCrawling = true;
                            parentPort === null || parentPort === void 0 ? void 0 : parentPort.postMessage({
                                method: CRAWLING_MESSAGES.TRACKING_TOKEN_STARTED,
                                data: { startBlock, networkHeight: currentNetworkHeight, trackingData }
                            });
                        }
                        // how many blocks missing? from start to current one
                        // example:
                        // Last indexed block: 2485, Start block: 2486, Network height: 2485
                        // last indexed is 2485, so will start indexing at next one: 2486 , but only when the network height is >= 2486
                        // if the start block is ahead of the last one, count that difference, otherwise the diff is net height - start block
                        const remainingBlocks = startBlock > lastIndexedBlock ? startBlock - lastIndexedBlock : currentNetworkHeight - startBlock;
                        // how many to process at once?
                        const blocksToProcess = Math.min(chunkSize, remainingBlocks);
                        console.log(`network: ${rpcDetails.network} processing ${blocksToProcess} blocks ...`);
                        if (blocksToProcess > 0) {
                            let chunkEvents = [];
                            try {
                                chunkEvents = yield retrieveChunkEvents(provider, startBlock, blocksToProcess);
                                console.log('EVENT SIZE TO PROCESS: ', chunkEvents.length);
                            }
                            catch (error) {
                                console.log(`Get events for network: ${rpcDetails.network} failure: ${error.message} \n\nConsider that there may be an issue with your RPC provider.`);
                                console.log('We recommend using private RPCs from reliable providers such as Infura or Alchemy.');
                                chunkSize = Math.floor(chunkSize / 2) < 1 ? 1 : Math.floor(chunkSize / 2);
                                console.log(`network: ${rpcDetails.network} Reducing chunk size  ${chunkSize} `, true);
                            }
                            try {
                                const processedBlocks = yield processBlocks(chunkEvents, token, 
                                // network,
                                provider, startBlock, blocksToProcess);
                                //console.log('try get balance AFTER blocks for wallet: ', token)
                                //const balance = await getCurrentBalance(tracker.getProvider(), token)
                                //console.log(`balance AFTER for wallet ${token} is: ${balance}`)
                                // if(checkBalanceUpdates(trackingData.current_balance, balance)) {
                                //   trackingData.current_balance = balance
                                // }
                                // array of ERC20Transfers []
                                const blocksWithTransactionsFound = processedBlocks.foundTransactions;
                                const hasTransactions = blocksWithTransactionsFound.length > 0;
                                // the number of the last block we checked for events/transactions
                                const lastProcessedBlock = processedBlocks.lastBlock;
                                currentBlock = yield updateLastIndexedBlockNumber(lastProcessedBlock, // the last on-chain block processed in this loop run
                                lastIndexedBlock, // last block i have recorded on DB for this wallet
                                trackingData);
                                // < 0 means it failed
                                const updatedBlock = currentBlock > 0;
                                // we can't just update currentBlock to processedBlocks.lastBlock if the DB action failed
                                if (!updatedBlock) {
                                    currentBlock = lastIndexedBlock;
                                }
                                // IF FAILED = > both current and last are the same (and the same value it was before the round)
                                // IF OK = > both are updated to the lastest processed block
                                lastIndexedBlock = currentBlock;
                                // update the memory reference as well
                                trackingData.last_block = lastIndexedBlock;
                                console.log('blocksWithTransactionsFound.size,', blocksWithTransactionsFound.length);
                                // if have any transactions data, update EVEN IF WE COULD NOT update the block
                                if (hasTransactions) {
                                    console.log('ERC20 Transfer Values: ', blocksWithTransactionsFound.values());
                                    parentPort === null || parentPort === void 0 ? void 0 : parentPort.postMessage({
                                        method: TRANSACTION_EVENTS.FOUND_TOKEN_TRANSACTIONS,
                                        data: { blocksWithTransactionsFound }
                                    });
                                    // WALLETS_EVENT_EMITTER.emit(TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS, blocksWithTransactionsFound.values())
                                    // consider use batch commands
                                    // if the tx hash is already on DB we skip it
                                    const updatedTransfers = yield updateTokenTrackingDataWithTransferData(userId, trackingData.token, trackingData.network, blocksWithTransactionsFound);
                                    if (!updatedTransfers) {
                                        console.log('Unable to add transfersData to DB');
                                    }
                                }
                                console.log('Done processed events, last indexed block was: ', lastIndexedBlock);
                                // checkNewlyIndexedAssets(processedBlocks.foundEvents)
                                chunkSize = chunkSize !== 1 ? chunkSize : rpcDetails.chunkSize || getDefaultChunkSize();
                            }
                            catch (error) {
                                console.error(`Processing event from network failed network: ${rpcDetails.network} Error: ${error.message} `);
                                currentBlock = startBlock + blocksToProcess;
                                lastIndexedBlock = currentBlock;
                                trackingData.last_block = lastIndexedBlock;
                                yield updateLastIndexedBlockNumber(currentBlock, lastIndexedBlock, trackingData);
                            }
                        }
                        else {
                            console.log('no new blocks, skipping...');
                        }
                        interval = getCrawlingInterval(1);
                    }
                    else {
                        // when no new blocks are detect, adjust the crawling interval
                        interval = getCrawlingInterval(2);
                        console.log(`Nothing to do, sleeping for ${interval / 1000} seconds...`);
                        console.log('FOUND TRANSFERS: ', counter);
                    }
                    // await processReindex(provider, signer, rpcDetails.network.chainId)
                    lockProccessing = false;
                }
                else {
                    console.log(`Processing already in progress for network ${rpcDetails.network}, waiting until finishing the current processing ...`);
                }
                //await sleep(interval)
                // reindex chain command called
                //   if (REINDEX_BLOCK && !lockProccessing) {
                //     const networkHeight = await getNetworkHeight(provider)
                //     // either "true" for success or "false" otherwise
                //     const result = await reindexChain(currentBlock, networkHeight)
                //     // get all reindex commands
                //     // TODO (check that we do not receive multiple commands for same reindex before previous finishes)
                //     parentPort.postMessage({
                //       method: INDEXER_CRAWLING_EVENTS.REINDEX_CHAIN,
                //       data: { result, chainId: rpcDetails.chainId }
                //     })
                //   }
                if (stoppedCrawling) {
                    console.log('Exiting thread...');
                    startedCrawling = false;
                    return;
                }
            });
        };
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const lastBlock = yield getLastIndexedBlock(userId, token, network);
            if (lastBlock > -1) {
                lastIndexedBlock = lastBlock;
            }
            doCrawl();
        }), interval);
    });
}
/**
 * Retrieve Transfer events logs
 * @param signer account signer
 * @param provider RPC provider
 * @param lastIndexedBlock the last indexed block on the chain
 * @param count number of blocks/chunks
 * @returns the event logs matching the topics
 */
export const retrieveChunkEvents = (provider, lastIndexedBlock, count) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const eventHashes = Object.values(EVENT_HASHES).map((event) => event.hash);
        const startIndex = lastIndexedBlock + 1;
        console.log('start get logs at ', startIndex);
        console.log('get until logs at ', lastIndexedBlock + count);
        console.log('topic hashes ', eventHashes);
        const blockLogs = yield provider.getLogs({
            fromBlock: startIndex,
            toBlock: lastIndexedBlock + count,
            topics: [eventHashes]
        });
        console.log('block logs: ', blockLogs);
        return blockLogs;
    }
    catch (error) {
        console.log('start: ', lastIndexedBlock + 1);
        console.log('last: ', lastIndexedBlock + count);
        console.log('height: ', yield getNetworkHeight(provider));
        throw new Error(` Error catched retrieveChunkEvents chunk of blocks events ${error.message}`);
    }
});
export function updateLastIndexedBlockNumber(lastProcessedBlock, lastIndexedBlock, trackingData) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('updateLastIndexedBlockNumber to ', lastProcessedBlock);
        console.log(`will update last block for token ${trackingData.token} to ${lastProcessedBlock}`);
        const updated = yield updateExistingTokenBlock(userId, trackingData.token, trackingData.network, 0, lastProcessedBlock);
        console.log('updateExistingTokenBlock returned ', updated);
        return updated ? lastProcessedBlock : -1;
    });
}
export const processBlocks = (blockLogs, token, 
//network: string,
provider, lastIndexedBlock, count) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let events = [];
        if (blockLogs && blockLogs.length > 0) {
            events = yield processChunkLogs(blockLogs, token, provider);
        }
        console.log('PROCESS BLOCKS FOR TOKEN:', token);
        return {
            token: token,
            lastBlock: lastIndexedBlock + count,
            foundTransactions: events
        };
    }
    catch (error) {
        throw new Error(` Error processing chunk of blocks events ${error.message}`);
    }
});
export const processChunkLogs = (logs, token, 
// network: string,
provider) => __awaiter(void 0, void 0, void 0, function* () {
    const storeEvents = [];
    if (logs.length > 0) {
        for (const log of logs) {
            console.log('Checking event log: ', log);
            let contractAddress = log.address;
            console.log('contract/contract address: ', contractAddress);
            console.log('token address: ', token);
            const eventHash = log.topics[0];
            const event = findEventByHash(eventHash);
            console.log('EVENT TYPE:  ', event === null || event === void 0 ? void 0 : event.type);
            if (event && event.type === EVENT_HASHES.Transfer.type) {
                if (contractAddress === token) {
                    console.log('FOUND IT');
                    counter++;
                }
                else
                    continue;
                // ---------------------------------------------------------------------------------------------------------------------------------
                // we will only receive events when the transfer recipent or the sender is the zero address meaning we are filtering mints and burn
                // ---------------------------------------------------------------------------------------------------------------------------------
                // https://berndstrehl.medium.com/parsing-an-erc20-transfer-with-javascript-from-the-eth-api-2790da37e55f
                console.log('checking if from/to matches token:', token);
                const tx = yield provider.getTransaction(log.transactionHash);
                console.log('TX before: ', tx);
                let transactionHash = tx === null || tx === void 0 ? void 0 : tx.hash;
                console.log('transaction hash: ', transactionHash);
                const toAddress = tx === null || tx === void 0 ? void 0 : tx.to;
                const fromAddress = tx === null || tx === void 0 ? void 0 : tx.from;
                const txData = tx === null || tx === void 0 ? void 0 : tx.data;
                const iface = new ethers.Interface(ERC20ABI);
                if (txData) {
                    const decodedTransaction = iface.parseTransaction({ data: txData, value: tx === null || tx === void 0 ? void 0 : tx.value });
                    console.log('DECODED TRANSACTION: ', decodedTransaction);
                    console.log('TX DATA: ', txData);
                }
                let isTransactionOut = fromAddress === token;
                let isTransactionIn = toAddress === token;
                let isPossibleMintOrBurn = !isTransactionIn && !isTransactionOut;
                let isPossibleTokenContract = contractAddress === token;
                // // the token contract address
                // // let contractAddress = null
                if (isTransactionOut && toAddress && !contractAddress) {
                    // //   // if transaction OUT, then it transfers to contract address (the TO)
                    contractAddress = toAddress;
                }
                console.log('isTransactionIn: ', isTransactionIn);
                console.log('isTransactionOut: ', isTransactionOut);
                console.log('isPossibleMintOrBurn: ', isPossibleMintOrBurn);
                console.log('isPossibleTokenContract: ', isPossibleTokenContract);
                console.log('TOKEN: ', token);
                if (isTransactionIn || isTransactionOut || isPossibleMintOrBurn || isPossibleTokenContract) {
                    const transactionData = yield parseTransferEvent(event, log, provider, token);
                    if (transactionData) {
                        storeEvents.push(transactionData);
                    }
                }
            } // end if event type == Transfer
        }
        /**
         * decode function input data
         * const iface = new ethers.utils.Interface(abi);
          const decodedArgs = iface.decodeFunctionData(tx.input.slice(0,10), tx.input)
          const functionName = iface.getFunction(tx.input.slice(0,10)).name
         */
    } // end for loop
    return storeEvents;
});
export function findEventByHash(hashKeyToFind) {
    for (const [key, value] of Object.entries(EVENT_HASHES)) {
        if (value.hash === hashKeyToFind) {
            return value;
        }
    }
    return null;
}
function checkBalanceUpdates(balanceBefore = 0, currentBalance = 0) {
    if (balanceBefore !== currentBalance) {
        console.log('BALANCE CHANGED, REPLICATE TRANSACTIONS?');
        const direction = balanceBefore < currentBalance ? ERC20TransferDirection.DIRECTION_IN : ERC20TransferDirection.DIRECTION_OUT;
        parentPort === null || parentPort === void 0 ? void 0 : parentPort.postMessage({
            method: TRANSACTION_EVENTS.FOUND_NATIVE_TRANSACTIONS,
            data: {
                balance_before: balanceBefore,
                balance_after: currentBalance,
                amount: Math.round(Math.abs(balanceBefore - currentBalance)), // round to nearest integer
                direction: direction
            }
        });
        return true;
    }
    return false;
}
// async function parseMintToAddressEvent(event: NetworkEvent, 
//   log: ethers.Log, 
//   provider: ethers.JsonRpcApiProvider, 
//   contractAddress: string, 
//   wallet: string): Promise <ERC20Transfers | null> {
//   console.log('parseMintEvent....')
//   console.log('EVENT IS: ',event)
//   console.log(`-- Event type [ ${event.type} ] was triggered for transaction: ${log.transactionHash}`)
//   const eventObj = {
//     topics: log.topics,
//     data: log.data
//   }
//   const iface = new Interface(ERC20ABI)
//   const decoded = iface.parseLog(eventObj)
//   console.log('DECODED LOG IS: ', decoded)
//   const txReceipt = await provider.getTransactionReceipt(log.transactionHash)
//   console.log('tx receipt: ', txReceipt)
//   if(txReceipt && decoded?.topic === EVENT_HASHES.Transfer.hash && decoded.name === EVENT_HASHES.Transfer.type && decoded?.args.length === 3) {
//     const from = decoded.args[0]
//     const to = decoded.args[1]
//     const valueTransfer =  decoded.args[2]
//     // const signer = await provider.getSigner()
//     const contract = new ethers.Contract(contractAddress, ERC20ABI, provider);
//     // when there is a burn its the other way around!
//     if(from === ZeroAddress && to === wallet) {
//       console.log('MINT CONFIRMED: ', from)
//       console.log('MINTED TOKENS TO WALLET: ', to)
//       // const valueTransfer = BigNumber.from(decoded.args[2])
//       console.log('VALUE: ', valueTransfer)
//       const decimals = Number(await contract.decimals())
//       let amountTransfered =  Number(ethers.formatUnits(decoded.args[2], decimals))
//       if(amountTransfered.toString().includes('e-')) {
//         amountTransfered = Number(amountTransfered.toFixed(decimals))
//       }
//       const tokenName = await contract.name()
//       const tokenSymbol = await contract.symbol()
//       console.log('DECIMALS:', decimals)
//       console.log('FROM WALLET: ', from)
//       console.log('TO WALLET: ', to)
//       console.log('AMOUNT MINTED: ', amountTransfered)
//       console.log('TOKEN: ', tokenName)
//       console.log('SYMBOL: ', tokenSymbol)
//       console.log('txt receipt: ', txReceipt)
//       let balanceAfter =  await contract.balanceOf(wallet)
//       balanceAfter = Number(ethers.formatUnits(balanceAfter, decimals))
//       let balanceBefore = balanceAfter - amountTransfered
//       if(balanceBefore < 0) {
//         balanceBefore = 0
//       }
//       console.log('balance before: ', balanceBefore)
//       const block = await provider.getBlock(txReceipt?.blockHash)
//       const transactionData: ERC20Transfers = {
//         hash: txReceipt?.hash,
//         token_address: contractAddress,
//         token_name: await tokenName,
//         token_symbol: tokenSymbol,
//         value: amountTransfered,
//         block: txReceipt?.blockNumber,
//         direction: ERC20TransferDirection.DIRECTION_IN,
//         timestamp: block ? block.timestamp : 0,
//         balance_after: balanceAfter,
//         balance_before: balanceBefore,
//         // chain: network,
//         transaction_type: ERC20TransactionType.MINT,
//         counter_part: contractAddress
//       }  
//       // console.log('transaction data for DB: ', transactionData)
//       return transactionData
//     }
//   } // end if decoded.topic ===
//   return null
// }
function parseTransferEvent(event, log, provider, token) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('EVENT IS:', event);
        console.log(`-- Event type [ ${event.type} ] was triggered for transaction: ${log.transactionHash}`);
        const eventObj = {
            topics: log.topics,
            data: log.data
        };
        // if not mint or burn is a normal transfer
        // mint or burn are identified by address ZERO
        let isMint = false;
        let isBurn = false;
        try {
            const iface = new Interface(ERC20ABI);
            const decoded = iface.parseLog(eventObj);
            console.log('DECODED LOG IS: ', decoded);
            const txReceipt = yield provider.getTransactionReceipt(log.transactionHash);
            console.log('tx receipt: ', txReceipt);
            // TODO maybe i don't need the txReceipt ???
            if (txReceipt != null) {
                let direction;
                if ((decoded === null || decoded === void 0 ? void 0 : decoded.topic) === EVENT_HASHES.Transfer.hash && decoded.name === EVENT_HASHES.Transfer.type && (decoded === null || decoded === void 0 ? void 0 : decoded.args.length) === 3) {
                    const contract = new ethers.Contract(token, ERC20ABI, provider);
                    const from = decoded.args[0];
                    const to = decoded.args[1];
                    TOKENS_LOGGER.info('VALUE: ' + decoded.args[2]);
                    const decimals = Number(yield contract.decimals());
                    const amountTransfered = Number(ethers.formatUnits(decoded.args[2], decimals));
                    const address = yield contract.getAddress();
                    if (address !== token) {
                        console.log('NOTHING RELATED WITH THIS TOKEN, IGNORE, decoded:', decoded);
                        return null;
                    }
                    // const signer = await provider.getSigner()
                    if (from === ZeroAddress && to !== token) {
                        isMint = true;
                        isBurn = false;
                        console.log('MINT CONFIRMED: ' + from);
                        console.log('MINTED TOKENS TO TOKEN ADDRESS: ' + to);
                        direction = ERC20TransferDirection.DIRECTION_OUT;
                    }
                    else if (to === ZeroAddress && from !== token) {
                        isMint = false;
                        isBurn = true;
                        console.log('BURN CONFIRMED: ' + to);
                        console.log('BURN TOKENS FROM TOKEN ADDRESS: ' + from);
                        direction = ERC20TransferDirection.DIRECTION_IN;
                    }
                    else {
                        direction = to === token ? ERC20TransferDirection.DIRECTION_IN : ERC20TransferDirection.DIRECTION_OUT;
                    }
                    // const valueTransfer = BigNumber.from(decoded.args[2])
                    const tokenName = yield contract.name();
                    const tokenSymbol = yield contract.symbol();
                    console.log('DECIMALS:' + decimals);
                    console.log('FROM WALLET: ' + from);
                    console.log('TO WALLET: ' + to);
                    console.log('AMOUNT: ' + amountTransfered);
                    console.log('TOKEN: ' + tokenName);
                    console.log('SYMBOL: ' + tokenSymbol);
                    console.log(`txt receipt: ${txReceipt}`);
                    let balanceAfter = yield contract.balanceOf(token);
                    balanceAfter = Number(ethers.formatUnits(balanceAfter, decimals));
                    let balanceBefore = (direction === ERC20TransferDirection.DIRECTION_IN) ? balanceAfter - amountTransfered : balanceAfter + amountTransfered;
                    if (balanceBefore < 0) {
                        balanceBefore = 0;
                    }
                    console.log('balance before: ' + balanceBefore);
                    const block = yield provider.getBlock(txReceipt.blockHash);
                    const transactionData = {
                        hash: txReceipt === null || txReceipt === void 0 ? void 0 : txReceipt.hash,
                        token_address: token,
                        token_name: yield tokenName,
                        token_symbol: tokenSymbol,
                        value: amountTransfered,
                        block: txReceipt.blockNumber,
                        direction: direction,
                        timestamp: block ? block.timestamp : 0,
                        balance_after: balanceAfter,
                        balance_before: balanceBefore,
                        // chain: network,
                        transaction_type: isMint ? ERC20TransactionType.MINT : isBurn ? ERC20TransactionType.BURN : ERC20TransactionType.TRANSFER,
                        counter_part: direction === ERC20TransferDirection.DIRECTION_IN ? from : to
                    };
                    return transactionData;
                }
            }
        }
        catch (error) {
            console.log('ERROR PARSING LOG: ', error);
            return null;
        }
        return null;
    });
}
// track nft stuff https://support.metamask.io/develop/building-with-infura/javascript-typescript/how-to-track-nft-transfers-mints-web3js/
//# sourceMappingURL=tokenTrackerThread.js.map