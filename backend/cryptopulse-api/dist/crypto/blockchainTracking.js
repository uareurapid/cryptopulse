var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ERC20ABI from '../utils/ERC20ABI.json' assert { type: 'json' };
import axios from 'axios';
import { ethers, Contract, JsonRpcProvider, isAddress, Network, parseUnits } from 'ethers';
import { getDefaultChunkSize, getNetworkHeight, getRPCProviderForNetwork, getStartBlockFromNetworkHeight, isSupportedNetwork, sleep } from '../utils/util.js';
import { getTrackedWallets, WALLETS_EVENT_EMITTER } from '../wallets/index.js';
import { Worker } from 'node:worker_threads';
// import { TokenTrackingData } from '../models/TokenTrakingPayload.js'
import { getTrackedTokens } from '../tokens/service.js';
import { CRAWLING_MESSAGES, EVENT_HASHES, START_TRACKING_EVENTS, TRANSACTION_EVENTS, WHALES_TREESHOLD } from '../utils/Constants.js';
import { CryptoPulseWebsocketServer } from '../ws/websocket.js';
WALLETS_EVENT_EMITTER.addListener(START_TRACKING_EVENTS.START_TRACKING_WALLET, (data) => {
    console.log('LISTENED START_TRACKING-WALLET with data: ', data);
});
// let contract 
// worker threads for crawling
const workers = {};
export class BlockchainTracking {
    constructor(rpc, chainName, chainId, fallbackRPCs) {
        this.knownRPCs = [];
        this.networkAvailable = false;
        this.chainId = chainId;
        this.knownRPCs.push(rpc);
        if (fallbackRPCs && fallbackRPCs.length > 0) {
            this.knownRPCs.push(...fallbackRPCs);
        }
        this.network = new ethers.Network(chainName, chainId);
        // this.provider = new ethers.JsonRpcProvider(rpc, this.network)
        this.provider = new ethers.JsonRpcProvider(rpc, undefined, {
            staticNetwork: ethers.Network.from(chainId)
        });
        this.registerForNetworkEvents();
        // always use this signer, not simply provider.getSigner(0) for instance (as we do on many tests)
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    }
    getSigner() {
        return this.signer;
    }
    getProvider() {
        return this.provider;
    }
    getSupportedChain() {
        return this.chainId;
    }
    getWalletAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.signer.getAddress();
        });
    }
    isNetworkReady() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.networkAvailable && this.provider.ready) {
                return { ready: true };
            }
            return yield this.detectNetwork();
        });
    }
    getKnownRPCs() {
        return this.knownRPCs;
    }
    calculateGasCost(to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = this.getProvider();
            const estimatedGas = yield provider.estimateGas({
                to,
                value: amount
            });
            const block = yield provider.getBlock('latest');
            const baseFee = block === null || block === void 0 ? void 0 : block.baseFeePerGas;
            const priorityFee = parseUnits('2', 'gwei');
            const maxFee = baseFee ? baseFee + priorityFee : priorityFee;
            const gasCost = estimatedGas * maxFee;
            return amount + gasCost;
        });
    }
    sendTransaction(wallet, to, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield wallet.sendTransaction({
                to,
                value: amount
            });
            const receipt = yield tx.wait();
            return receipt;
        });
    }
    detectNetwork() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                // timeout, hanging or invalid connection
                console.error(`Unable to detect provider network: (TIMEOUT)`);
                resolve({ ready: false, error: 'TIMEOUT' });
            }, 3000);
            this.provider
                .getBlock('latest')
                .then((block) => {
                clearTimeout(timeout);
                resolve({ ready: (block === null || block === void 0 ? void 0 : block.hash) !== null });
            })
                .catch((err) => {
                console.error(`Unable to detect provider network: ${err.message}`);
                clearTimeout(timeout);
                resolve({ ready: false, error: err.message });
            });
        });
    }
    // try other rpc options, if available
    tryFallbackRPCs() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = { ready: false, error: '' };
            // we also retry the original one again after all the fallbacks
            for (let i = this.knownRPCs.length - 1; i >= 0; i--) {
                this.provider.off('network');
                console.log(`Retrying new provider connection with RPC: ${this.knownRPCs[i]}`);
                this.provider = new JsonRpcProvider(this.knownRPCs[i]);
                this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
                // try them 1 by 1 and wait a couple of secs for network detection
                this.registerForNetworkEvents();
                yield sleep(2000);
                response = yield this.isNetworkReady();
                // return as soon as we have a valid one
                if (response.ready) {
                    return response;
                }
            }
            return response;
        });
    }
    registerForNetworkEvents() {
        this.provider.on('network', this.networkChanged);
    }
    networkChanged(newNetwork) {
        // When a Provider makes its initial connection, it emits a "network"
        // event with a null oldNetwork along with the newNetwork. So, if the
        // oldNetwork exists, it represents a changing network
        this.networkAvailable = newNetwork instanceof Network;
    }
}
export function getDatatokenDecimals(datatokenAddress, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const datatokenContract = new Contract(datatokenAddress, ERC20ABI, provider);
        try {
            return yield datatokenContract.decimals();
        }
        catch (err) {
            console.error(`${err}. Returning default 18 decimals.`);
            return 18;
        }
    });
}
/**
 * Verify a signed message, see if signature matches address
 * @param message to verify
 * @param address to check against
 * @param signature to validate
 * @returns boolean
 */
export function verifyMessage(message, address, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!isAddress(address)) {
                console.error(`${address} is not a valid web3 address`);
                return false;
            }
            const signerAddr = yield ethers.verifyMessage(message, signature);
            if ((signerAddr === null || signerAddr === void 0 ? void 0 : signerAddr.toLowerCase()) !== (address === null || address === void 0 ? void 0 : address.toLowerCase())) {
                return false;
            }
            return true;
        }
        catch (err) {
            return false;
        }
    });
}
export function checkSupportedChainId(chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        return true;
    });
}
/**
 * Starts crawling threads for all the wallets of the current user
 * @param userId the current user
 */
export function startListeningWallets(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // const arrayOfListeners: BlockchainTracking[] = []
        const trackingWallets = yield getTrackedWallets(userId);
        console.log('tracking wallets are: ', trackingWallets.wallets);
        if (trackingWallets && trackingWallets.wallets.length > 0) { // TokenTrackingData[]
            const walletsToTrack = trackingWallets.wallets;
            // threads data
            const walletsToCrawl = [];
            for (const walletInfo of walletsToTrack) {
                const { network, wallet } = walletInfo;
                // const  = walletInfo.wallet
                console.log('checking wallet info: ', walletInfo);
                // const network = walletInfo.network // the name
                console.log('network name: ', network);
                console.log('wallet address: ', wallet);
                // TODO we should only have ne blockchain instance per network
                // the RPCS must have been configured per that we network added suppport for 
                // for now just hardcode it
                // TODO group by network
                const supportedNetwork = yield isSupportedNetwork(network);
                const rpc = yield getRPCProviderForNetwork(network);
                if (supportedNetwork && rpc) {
                    console.log('yes, is supported');
                    // first get the block info. If still -1, try to start from network height
                    let startBlock = walletInfo.start_block;
                    if (!startBlock || startBlock === -1) {
                        startBlock = yield getStartBlockFromNetworkHeight(supportedNetwork);
                    }
                    const rpcDetails = {
                        network: supportedNetwork,
                        //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
                        rpc: rpc,
                        chunkSize: walletInfo.chunk_size || getDefaultChunkSize(),
                        startBlock: startBlock
                    };
                    // crawler thread data
                    walletsToCrawl.push({ walletData: walletInfo, rpcDetails: rpcDetails });
                }
                else {
                    console.log('network not supported: ', network);
                }
            } // end for
            for (const crawlerData of walletsToCrawl) {
                yield startWalletListeningThread(userId, crawlerData.walletData, crawlerData.rpcDetails);
            }
        } // end if
    });
}
/**
 * Called by the above method as well, for a
 * @param userId
 */
export function startListeningSingleWallet(walletInfo, userId, supported) {
    return __awaiter(this, void 0, void 0, function* () {
        // threads data
        let walletToCrawl;
        const { network, wallet } = walletInfo;
        console.log('checking wallet info: ', walletInfo);
        console.log('network name: ', network);
        console.log('wallet address: ', wallet);
        // TODO we should only have ne blockchain instance per network
        // the RPCS must have been configured per that we network added suppport for 
        // for now just hardcode it
        // TODO group by network
        let supportedNetwork = supported;
        if (!supportedNetwork) {
            supportedNetwork = yield isSupportedNetwork(network);
        }
        const rpc = yield getRPCProviderForNetwork(network);
        if (supportedNetwork && rpc) {
            console.log('yes, is supported');
            const rpcDetails = {
                network: supportedNetwork,
                //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
                rpc: rpc,
                chunkSize: walletInfo.chunk_size || getDefaultChunkSize(),
                startBlock: walletInfo.start_block
            };
            // crawler thread data
            walletToCrawl = { walletData: walletInfo, rpcDetails: rpcDetails };
            // listenForWalletTransferEvents([walletInfo.wallet], rpcDetails)
            yield startWalletListeningThread(userId, walletToCrawl.walletData, walletToCrawl.rpcDetails);
        }
        else {
            console.log('not supported ', network);
        }
        // getLiveLogs(dataForTracking.rpcDetails)
    });
}
export function startListeningTokens(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // const arrayOfListeners: BlockchainTracking[] = []
        const trackingTokens = yield getTrackedTokens(userId);
        console.log('tracking tokens are: ', trackingTokens.tokens);
        if (trackingTokens && trackingTokens.tokens.length > 0) { // TokenTrackingData[]
            const tokens = trackingTokens.tokens;
            // threads data
            const tokensToWatch = [];
            for (const tokenInfo of tokens) {
                const { network, token } = tokenInfo;
                console.log('checking tokenInfo info: ', tokenInfo);
                // const network = tokenInfo.network // the name
                console.log('network name: ', network);
                // TODO we should only have ne blockchain instance per network
                // the RPCS must have been configured per that we network added suppport for 
                // for now just hardcode it
                const supportedNetwork = yield isSupportedNetwork(network);
                const rpc = yield getRPCProviderForNetwork(network);
                if (supportedNetwork && rpc) {
                    console.log('yes, is supported');
                    const rpcDetails = {
                        network: supportedNetwork,
                        // rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
                        rpc: rpc, // 'https://mainnet.infura.io/v3/cc9e526672204ea4ab7a1632d119f60f',
                        chunkSize: tokenInfo.chunk_size || getDefaultChunkSize()
                    };
                    // crawler thread data
                    tokensToWatch.push({ tokenData: tokenInfo, rpcDetails: rpcDetails });
                }
                else {
                    console.log('not supported');
                }
            }
            for (const tokenData of tokensToWatch) {
                yield startTokenListeningThread(userId, tokenData.tokenData, tokenData.rpcDetails);
            }
        }
    });
}
export function startListeningSingleToken(tokenInfo, userId, supported) {
    return __awaiter(this, void 0, void 0, function* () {
        // threads data
        let tokenToWatch;
        const { network, token } = tokenInfo;
        console.log('checking token info: ', tokenInfo);
        console.log('network name: ', network);
        console.log('token address: ', token);
        // TODO we should only have ne blockchain instance per network
        // the RPCS must have been configured per that we network added suppport for 
        // for now just hardcode it
        // TODO group by network
        let supportedNetwork = supported;
        if (!supportedNetwork) {
            supportedNetwork = yield isSupportedNetwork(network);
        }
        const rpc = yield getRPCProviderForNetwork(network);
        if (supportedNetwork && rpc) {
            console.log('yes, is supported');
            const rpcDetails = {
                network: supportedNetwork,
                //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
                rpc: rpc,
                chunkSize: tokenInfo.chunk_size || getDefaultChunkSize(),
                startBlock: tokenInfo.start_block
            };
            // crawler thread data
            tokenToWatch = { tokenData: tokenInfo, rpcDetails: rpcDetails };
            // listenForWalletTransferEvents([walletInfo.wallet], rpcDetails)
            yield startTokenListeningThread(userId, tokenToWatch.tokenData, tokenToWatch.rpcDetails);
        }
        else {
            console.log('not supported ', network);
        }
        // getLiveLogs(dataForTracking.rpcDetails)
    });
}
/**
 *
 * @param user user id
 * @param address token or wallet address
 * @param network chain id or number
 * @returns unique identifier for the worker thread
 */
export function buildWorkerIdentifier(user, address, network) {
    const id = user + '_' + address + '_' + network;
    return id;
}
// ################################################################################################
// ################################### START WALLET THREAD ########################################
// ################################################################################################
/**
 * Starts a worker thread, for listening on-chain wallet events
 * @param data the wallet and tracking data
 * @param rpcInfo rpc details
 */
function startWalletListeningThread(userId, data, rpcInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const workerData = { userId: userId, trackingData: data, rpcDetails: rpcInfo };
        //   // see if it exists already, otherwise create a new one
        const id = buildWorkerIdentifier(userId, data.wallet, data.network);
        console.log('worker thread id: ', id);
        console.log('startWalletListeningThread with workerData: ', workerData);
        let worker = workers[id]; // no worker for this network and wallet
        if (worker) {
            console.log(`Worker with ID: ${id} already exists, skipping!`);
            return;
        }
        worker = new Worker('./dist/crypto/walletTrackerThread.js', {
            workerData
        });
        workers[id] = worker;
        // listens from child when the crawling actually starts
        worker.on('message', (event) => {
            console.log('got worket message: ', event.method);
            if (event.data) {
                const data = event.data;
                if (event.method === CRAWLING_MESSAGES.TRACKING_WALLET_STARTED) {
                    console.log('MAIN, Listened CRAWLING_MESSAGES.TRACKING_WALLET_STARTED with data: ', data);
                }
                if (event.method === TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS) {
                    console.log('LISTENED FOUND_WALLET_TRANSACTIONS with data: ', data);
                    CryptoPulseWebsocketServer.getInstance().sendWebsocketsMessageToClient(JSON.stringify(data));
                }
                if (event.method === TRANSACTION_EVENTS.FOUND_NATIVE_TRANSACTIONS) {
                    console.log('LISTENED FOUND_NATIVE_TRANSACTIONS with data: ', data);
                    if (data.amount > WHALES_TREESHOLD.WHALE_NATIVE_TRANSFER) {
                        // console.log('whale')
                    }
                }
            }
        });
        // TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS
        // Instruct the worker thread to actually start the crawling process
        worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_WALLET });
    });
}
// ################################################################################################
// ################################### START TOKEN THREAD #########################################
// ################################################################################################
function startTokenListeningThread(userId, data, rpcInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const workerData = { userId: userId, trackingData: data, rpcDetails: rpcInfo };
        //   // see if it exists already, otherwise create a new one
        const id = buildWorkerIdentifier(userId, data.token, data.network);
        console.log('worker thread id: ', id);
        console.log('startTokenListeningThread with workerData: ', workerData);
        let worker = workers[id]; // no worker for this network and wallet
        if (worker) {
            console.log(`Worker with ID: ${id} already exists, skipping!`);
            return;
        }
        worker = new Worker('./dist/crypto/tokenTrackerThread.js', {
            workerData
        });
        workers[id] = worker;
        // listens from child when the crawling actually starts
        worker.on('message', (event) => {
            console.log('got worker message: ', event.method);
            if (event.data) {
                const data = event.data;
                if (event.method === CRAWLING_MESSAGES.TRACKING_TOKEN_STARTED) {
                    console.log('MAIN, Listened CRAWLING_MESSAGES.TRACKING_TOKEN_STARTED with data: ', data);
                }
                if (event.method === TRANSACTION_EVENTS.FOUND_TOKEN_TRANSACTIONS) {
                    console.log('LISTENED FOUND_TOKEN_TRANSACTIONS with data: ', data);
                    CryptoPulseWebsocketServer.getInstance().sendWebsocketsMessageToClient(JSON.stringify(data));
                }
                if (event.method === TRANSACTION_EVENTS.FOUND_NATIVE_TRANSACTIONS) {
                    console.log('LISTENED FOUND_NATIVE_TRANSACTIONS with data: ', data);
                    if (data.amount > WHALES_TREESHOLD.WHALE_NATIVE_TRANSFER) {
                        // console.log('whale')
                    }
                }
            }
        });
        // TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS
        // Instruct the worker thread to actually start the crawling process
        worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_TOKEN });
    });
}
function getAddressFullTransactionHistory(address, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        // var address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        let fullTransactions = [];
        let nextBlock = 0;
        const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
        while (true) {
            const requestTransactions = yield axios.get(`https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${nextBlock}&endblock=latest&page=1&offset=1000&sort=asc&apikey=${ETHERSCAN_API_KEY}`);
            const transactions = yield requestTransactions.data;
            nextBlock = Number(transactions.result[transactions.result.length - 1].blockNumber);
            transactions.result.forEach((tx) => {
                if (tx.blockNumber != nextBlock || transactions.result.length != 1000) {
                    console.log('pushing transaction: ', tx.hash);
                    fullTransactions.push(tx.hash);
                }
            });
            if (transactions.result.length < 1000)
                break;
        }
        console.log(`Retrieved ${fullTransactions.length} transactions for ${address}`);
    });
}
function listenForERC20TransferEvents(tokenContractAddresses, rpcDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        // async function getTransfer(){
        // const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; ///USDC Contract
        const blockChainHandler = new BlockchainTracking(rpcDetails.rpc, rpcDetails.network.chainName, rpcDetails.network.chainId);
        const provider = blockChainHandler.getProvider(); // new ethers.WebSocketProvider('wss://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
        //);
        // const provider = new ethers.JsonRpcApiProvider(
        //    'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
        //  );
        //  const provider = new ethers.JsonRpcProvider( 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6', undefined, {
        //   staticNetwork: ethers.Network.from(rpcDetails.network.chainId)
        // })
        // const provider = blockChainHandler.getProvider()
        console.log('provider ', provider);
        for (const tokenAddress of tokenContractAddresses) {
            const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
            console.log('decimals:', yield contract.decimals());
            const decimals = Number(contract.decimals);
            console.log('contract ', contract);
            contract.on("Transfer", (from, to, value, eventData) => {
                console.log('from: ', from);
                console.log('to: ', to);
                console.log('value: ', value);
                console.log('eventData: ', eventData);
                let transferEvent = {
                    from: from,
                    to: to,
                    value: value,
                    eventData: eventData,
                };
                console.log('transfer event detected:', transferEvent);
                console.log('transfer event logs:', transferEvent.eventData.log);
                console.log('value: ', ethers.formatUnits(transferEvent.value, decimals));
            });
        }
        //}
    });
}
//https://developers.moralis.com/how-to-listen-to-smart-contract-events-using-ethers-js/
//https://github.com/ethers-io/ethers.js/discussions/1506
/**
 * transfer event detected: {
  from: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251',
  to: '0xeF4fB24aD0916217251F553c0596F8Edc630EB66',
  value: 500763243n,
  eventData: ContractEventPayload {
    filter: 'Transfer',
    emitter: Contract {
      target: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      interface: [Interface],
      runner: WebSocketProvider {},
      filters: {},
      fallback: [AsyncFunction],
      [Symbol(_ethersInternal_contract)]: {}
    },
    log: EventLog {
      provider: WebSocketProvider {},
      transactionHash: '0x3d74cf06c63b1213bb6a4f9e2d7d988fbc50ca035219bb54067d935ba8d088ee',
      blockHash: '0x63934991ea840033499200eabdb1ad11d5b72790ea2c62426bfc0caf7298d7a0',
      blockNumber: 22205887,
      removed: false,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      data: '0x000000000000000000000000000000000000000000000000000000001dd90a6b',
      topics: [Array],
      index: 440,
      transactionIndex: 119,
      interface: [Interface],
      fragment: [EventFragment],
      args: [Result]
    },
    args: Result(3) [
      '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251',
      '0xeF4fB24aD0916217251F553c0596F8Edc630EB66',
      500763243n
    ],
    fragment: EventFragment {
      type: 'event',
      inputs: [Array],
      name: 'Transfer',
      anonymous: false
    }
  }
}
 */
/**
 * TODO
 * When we start stracking we should start at a given block
 * When we process any event, we should also update the last block
 * @param walletAddresses
 * @param rpcDetails
 */
function listenForWalletTransferEvents(walletAddresses, rpcDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * Filters are short-lived. A given filter expires if it's not utilized within 5 minutes.
         * You need to make sure that you request eth_getFilterChanges before the filter expires.
         * As long as you periodically poll eth_getFilterChanges within 5 minutes timeframes, the filter will not expire.
        */
        const blockChainHandler = new BlockchainTracking(rpcDetails.rpc, rpcDetails.network.chainName, rpcDetails.network.chainId);
        // const provider = new ethers.WebSocketProvider('wss://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6')
        // blockChainHandler.getProvider() // 
        // );
        // const provider = new ethers.JsonRpcProvider(
        //     'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
        //   );
        // //  const provider = new ethers.JsonRpcProvider( 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6', undefined, {
        // //   staticNetwork: ethers.Network.from(rpcDetails.network.chainId)
        // // })
        const provider = blockChainHandler.getProvider();
        console.log('provider ', provider);
        console.log('Will filter transfer events for (from/to) wallet(s): ', walletAddresses);
        for (const address of walletAddresses) {
            const filter = {
                // ERC20 Transfer(address indexed from, address indexed to, uint256 value) 3rd topic not indexed
                //ERC721 Transfer(address indexed from, address indexed to, uint256 indexed tokenId) all 3 indexed
                topics: [
                    EVENT_HASHES.Transfer.hash, //ethers.id('Transfer(address, address, uint256)'),
                    //address lists
                    [
                        ethers.zeroPadValue(address, 32)
                        // from
                    ],
                    [
                        ethers.zeroPadValue(address, 32)
                    ] // to
                ]
            };
            provider.on(filter, (data) => {
                console.log(`Got wallet ${address} transfer data:`, data);
            });
        }
        /**
         * For getting Logs (non live/interactive we can use)
         * const filter = [utils.id('newProposal(address,uint256,string)')];
          this.logs = await this.provider.getLogs({
          fromBlock: 12794325,
          toBlock: 'latest',
          address: this.Dao.address,
          topics: filter,
        });
         */
        //}
    });
}
export function getLiveLogs(rpcDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        const blockChainHandler = new BlockchainTracking(rpcDetails.rpc, rpcDetails.network.chainName, rpcDetails.network.chainId);
        const provider = blockChainHandler.getProvider();
        const currentBlock = yield getNetworkHeight(provider);
        const beforeBlock = currentBlock - 3;
        const logs = yield provider.getLogs({
            fromBlock: beforeBlock,
            toBlock: currentBlock,
            topics: [ethers.id('Transfer(address,address,uint256)')],
        });
        // const formatted: BlockchainLogs[] = [... logs]
        console.log('got live logs: ', logs[1]);
        const data = yield provider.getTransactionReceipt(logs[1].transactionHash);
        console.log('final data: ', data);
        yield sleep(3000);
        // process.exit(0)
    });
}
// 0xb3fa6655717101ba052f3a85b2153c7d9ae2916960fc757c92b7e94242f405c4
//TODO for internal transfers the way to do it is check balance changes after each block for the given account
export function processReindexToken(userId, tokenData) {
    const id = buildWorkerIdentifier(userId, tokenData.token, tokenData.network);
    console.log('worker thread id: ', id);
    let worker = workers[id]; // no worker for this network and wallet
    if (worker) {
        worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_WALLET });
        return true;
    }
    return false;
}
//# sourceMappingURL=blockchainTracking.js.map