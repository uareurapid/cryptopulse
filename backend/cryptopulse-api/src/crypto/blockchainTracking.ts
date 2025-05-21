import ERC20ABI from '../utils/ERC20ABI.json' assert {type: 'json'}
import axios from 'axios';
import {
  ethers,
  Signer,
  Contract,
  JsonRpcApiProvider,
  JsonRpcProvider,
  isAddress,
  Network,
  parseUnits,
  Wallet,
  TransactionReceipt
} from 'ethers'

import { getDefaultChunkSize, getNetworkHeight, getRPCProviderForNetwork, getStartBlockFromNetworkHeight, isSupportedNetwork, sleep } from '../utils/util.js'
import { ConnectionStatus, RPCDetails, SupportedNetwork } from '../types/common.js'
import { getTrackedWallets, WALLETS_EVENT_EMITTER } from '../wallets/index.js'

import { Worker } from 'node:worker_threads'
// import { TokenTrackingData } from '../models/TokenTrakingPayload.js'
import { getTrackedTokens } from '../tokens/service.js';
import { TokenCrawlingData, TokenTrackingData, TrackedTokensAPIResponse } from '../models/Tokens.js';
import { CRAWLING_MESSAGES, EVENT_HASHES, START_TRACKING_EVENTS, TRANSACTION_EVENTS, WHALES_TREESHOLD } from '../utils/Constants.js';
import { CryptoPulseWebsocketServer } from '../ws/websocket.js';
import { TrackedWalletsAPIResponse, WalletCrawlingData, WalletTrackingData } from '../models/Wallets.js';

WALLETS_EVENT_EMITTER.addListener(START_TRACKING_EVENTS.START_TRACKING_WALLET, (data) => {

  console.log('LISTENED START_TRACKING-WALLET with data: ', data)
})

// let contract 
// worker threads for crawling
const workers: Record<string,Worker> = {}

export class BlockchainTracking {
  private signer: Signer
  private provider: JsonRpcApiProvider
  private chainId: number
  private knownRPCs: string[] = []
  private network: Network
  private networkAvailable: boolean = false

  public constructor(
    rpc: string,
    chainName: string,
    chainId: number,
    fallbackRPCs?: string[]
  ) {
    this.chainId = chainId
    this.knownRPCs.push(rpc)
    if (fallbackRPCs && fallbackRPCs.length > 0) {
      this.knownRPCs.push(...fallbackRPCs)
    }
    this.network = new ethers.Network(chainName, chainId)
    // this.provider = new ethers.JsonRpcProvider(rpc, this.network)
    this.provider = new ethers.JsonRpcProvider(rpc, undefined, {
      staticNetwork: ethers.Network.from(chainId)
    })
    this.registerForNetworkEvents()
    // always use this signer, not simply provider.getSigner(0) for instance (as we do on many tests)
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, this.provider)
  }

  public getSigner(): Signer {
    return this.signer
  }

  public getProvider(): JsonRpcApiProvider {
    return this.provider
  }

  public getSupportedChain(): number {
    return this.chainId
  }

  public async getWalletAddress(): Promise<string> {
    return await this.signer.getAddress()
  }

  public async isNetworkReady(): Promise<ConnectionStatus> {
    if (this.networkAvailable && this.provider.ready) {
      return { ready: true }
    }
    return await this.detectNetwork()
  }

  public getKnownRPCs(): string[] {
    return this.knownRPCs
  }

  public async calculateGasCost(to: string, amount: bigint): Promise<bigint> {
    const provider = this.getProvider()
    const estimatedGas = await provider.estimateGas({
      to,
      value: amount
    })

    const block = await provider.getBlock('latest')
    const baseFee = block?.baseFeePerGas
    const priorityFee = parseUnits('2', 'gwei')
    const maxFee = baseFee ? baseFee + priorityFee: priorityFee
    const gasCost = estimatedGas * maxFee

    return amount + gasCost
  }

  public async sendTransaction(
    wallet: Wallet,
    to: string,
    amount: bigint
  ): Promise<TransactionReceipt | null> {
    const tx = await wallet.sendTransaction({
      to,
      value: amount
    })
    const receipt = await tx.wait()

    return receipt
  }

  private detectNetwork(): Promise<ConnectionStatus> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // timeout, hanging or invalid connection
        console.error(`Unable to detect provider network: (TIMEOUT)`)
        resolve({ ready: false, error: 'TIMEOUT' })
      }, 3000)

      this.provider
        .getBlock('latest')
        .then((block) => {
          clearTimeout(timeout)
          resolve({ ready: block?.hash !== null })
        })
        .catch((err) => {
          console.error(`Unable to detect provider network: ${err.message}`)
          clearTimeout(timeout)
          resolve({ ready: false, error: err.message })
        })
    })
  }

  // try other rpc options, if available
  public async tryFallbackRPCs(): Promise<ConnectionStatus> {
    let response: ConnectionStatus = { ready: false, error: '' }
    // we also retry the original one again after all the fallbacks
    for (let i = this.knownRPCs.length - 1; i >= 0; i--) {
      this.provider.off('network')
      console.log(`Retrying new provider connection with RPC: ${this.knownRPCs[i]}`)
      this.provider = new JsonRpcProvider(this.knownRPCs[i])
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, this.provider)
      // try them 1 by 1 and wait a couple of secs for network detection
      this.registerForNetworkEvents()
      await sleep(2000)
      response = await this.isNetworkReady()
      // return as soon as we have a valid one
      if (response.ready) {
        return response
      }
    }
    return response
  }

  private registerForNetworkEvents() {
    this.provider.on('network', this.networkChanged)
  }

  private networkChanged(newNetwork: any) {
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    this.networkAvailable = newNetwork instanceof Network
  }
}

export async function getDatatokenDecimals(
  datatokenAddress: string,
  provider: JsonRpcProvider
): Promise<number> {
  const datatokenContract = new Contract(datatokenAddress, ERC20ABI, provider)
  try {
    return await datatokenContract.decimals()
  } catch (err) {
    console.error(`${err}. Returning default 18 decimals.`)
    return 18
  }
}

/**
 * Verify a signed message, see if signature matches address
 * @param message to verify
 * @param address to check against
 * @param signature to validate
 * @returns boolean
 */
export async function verifyMessage(
  message: string | Uint8Array,
  address: string,
  signature: string
) {
  try {
    if (!isAddress(address)) {
      console.error(`${address} is not a valid web3 address`)
      return false
    }
    const signerAddr = await ethers.verifyMessage(message, signature)
    if (signerAddr?.toLowerCase() !== address?.toLowerCase()) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

export async function checkSupportedChainId(chainId: number): Promise<boolean> {
  return true
}
/**
 * Starts crawling threads for all the wallets of the current user
 * @param userId the current user
 */
export async function startListeningWallets(userId: string) {

  // const arrayOfListeners: BlockchainTracking[] = []
  const trackingWallets: TrackedWalletsAPIResponse = await getTrackedWallets(userId)
  console.log('tracking wallets are: ', trackingWallets.wallets)
  if(trackingWallets && trackingWallets.wallets.length > 0) { // TokenTrackingData[]
    const walletsToTrack: WalletTrackingData[] = trackingWallets.wallets

    // threads data
    const walletsToCrawl: WalletCrawlingData[] = []

    for(const walletInfo of walletsToTrack) {
      const { network, wallet} = walletInfo
      // const  = walletInfo.wallet
      console.log('checking wallet info: ', walletInfo)
      // const network = walletInfo.network // the name
      console.log('network name: ', network)
      console.log('wallet address: ', wallet)
      // TODO we should only have ne blockchain instance per network
      // the RPCS must have been configured per that we network added suppport for 
      // for now just hardcode it

      // TODO group by network
      const supportedNetwork = await isSupportedNetwork(network)
      const rpc = await getRPCProviderForNetwork(network)
      if(supportedNetwork && rpc) {
        console.log('yes, is supported')
        // first get the block info. If still -1, try to start from network height
        let startBlock = walletInfo.start_block 
        if(!startBlock || startBlock === -1) {
          startBlock = await getStartBlockFromNetworkHeight(supportedNetwork)
        }
        const rpcDetails: RPCDetails =  {
          network: supportedNetwork,
          //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
          rpc: rpc,
          chunkSize: walletInfo.chunk_size || getDefaultChunkSize(),
          startBlock: startBlock 
        }

        // crawler thread data
        walletsToCrawl.push({walletData: walletInfo, rpcDetails: rpcDetails})

      } else {
        console.log('network not supported: ', network)
      }
    } // end for

    for(const crawlerData of walletsToCrawl) {
      await startWalletListeningThread(userId, crawlerData.walletData, crawlerData.rpcDetails)
    }
  } // end if
}

/**
 * Called by the above method as well, for a 
 * @param userId 
 */
export async function startListeningSingleWallet(walletInfo: WalletTrackingData, userId: string, supported: SupportedNetwork) {

  // threads data
  let walletToCrawl: WalletCrawlingData

  const { network, wallet} = walletInfo
  console.log('checking wallet info: ', walletInfo)
  console.log('network name: ', network)
  console.log('wallet address: ', wallet)
  // TODO we should only have ne blockchain instance per network
  // the RPCS must have been configured per that we network added suppport for 
  // for now just hardcode it

  // TODO group by network
  let supportedNetwork: SupportedNetwork | null = supported
  if(!supportedNetwork) {
    supportedNetwork = await isSupportedNetwork(network)
  } 
  const rpc = await getRPCProviderForNetwork(network)
  if(supportedNetwork && rpc) {
    console.log('yes, is supported')
    const rpcDetails: RPCDetails =  {
      network: supportedNetwork,
      //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
      rpc: rpc,
      chunkSize: walletInfo.chunk_size || getDefaultChunkSize(),
      startBlock: walletInfo.start_block 
    }
  
    // crawler thread data
    walletToCrawl = {walletData: walletInfo, rpcDetails: rpcDetails}
  
    // listenForWalletTransferEvents([walletInfo.wallet], rpcDetails)
        
    await startWalletListeningThread(userId, walletToCrawl.walletData, walletToCrawl.rpcDetails)
          
  } else {
    console.log('not supported ', network)
  }
         
  // getLiveLogs(dataForTracking.rpcDetails)
        
}

export async function startListeningTokens(userId: string) {

  // const arrayOfListeners: BlockchainTracking[] = []
  const trackingTokens: TrackedTokensAPIResponse = await getTrackedTokens(userId)
  console.log('tracking tokens are: ', trackingTokens.tokens)
  if(trackingTokens && trackingTokens.tokens.length > 0) { // TokenTrackingData[]
    const tokens: TokenTrackingData[] = trackingTokens.tokens

    // threads data
    const tokensToWatch: TokenCrawlingData[] = []

    for(const tokenInfo of tokens) {

      const { network, token} = tokenInfo

      console.log('checking tokenInfo info: ', tokenInfo)
      // const network = tokenInfo.network // the name
      console.log('network name: ', network)
      // TODO we should only have ne blockchain instance per network
      // the RPCS must have been configured per that we network added suppport for 
      // for now just hardcode it

      const supportedNetwork = await isSupportedNetwork(network)
      const rpc = await getRPCProviderForNetwork(network)
      if(supportedNetwork && rpc) {
        console.log('yes, is supported')
        const rpcDetails: RPCDetails =  {
          network: supportedNetwork,
          // rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
          rpc: rpc, // 'https://mainnet.infura.io/v3/cc9e526672204ea4ab7a1632d119f60f',
          chunkSize: tokenInfo.chunk_size || getDefaultChunkSize()
        }

        // crawler thread data
        tokensToWatch.push({tokenData: tokenInfo, rpcDetails: rpcDetails})

      } else {
        console.log('not supported')
      }
    }

    for(const tokenData of tokensToWatch) {
      await startTokenListeningThread(userId, tokenData.tokenData, tokenData.rpcDetails)
    }
  }
}

export async function startListeningSingleToken(tokenInfo: TokenTrackingData, userId: string, supported: SupportedNetwork) {

  // threads data
  let tokenToWatch: TokenCrawlingData

  const { network, token} = tokenInfo
  console.log('checking token info: ', tokenInfo)
  console.log('network name: ', network)
  console.log('token address: ', token)
  // TODO we should only have ne blockchain instance per network
  // the RPCS must have been configured per that we network added suppport for 
  // for now just hardcode it

  // TODO group by network
  let supportedNetwork: SupportedNetwork | null = supported
  if(!supportedNetwork) {
    supportedNetwork = await isSupportedNetwork(network)
  } 
  const rpc = await getRPCProviderForNetwork(network)
  if(supportedNetwork && rpc) {
    console.log('yes, is supported')
    const rpcDetails: RPCDetails =  {
      network: supportedNetwork,
      //rpc: 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6',
      rpc: rpc,
      chunkSize: tokenInfo.chunk_size || getDefaultChunkSize(),
      startBlock: tokenInfo.start_block 
    }
  
    // crawler thread data
    tokenToWatch = {tokenData: tokenInfo, rpcDetails: rpcDetails}
  
    // listenForWalletTransferEvents([walletInfo.wallet], rpcDetails)
        
    await startTokenListeningThread(userId, tokenToWatch.tokenData, tokenToWatch.rpcDetails)
          
  } else {
    console.log('not supported ', network)
  }
         
  // getLiveLogs(dataForTracking.rpcDetails)
        
}

/**
 * 
 * @param user user id
 * @param address token or wallet address
 * @param network chain id or number
 * @returns unique identifier for the worker thread
 */
export function buildWorkerIdentifier(user: string, address: string, network: string): string {
  const id = user + '_' + address + '_' + network
  return id
}

// ################################################################################################
// ################################### START WALLET THREAD ########################################
// ################################################################################################
/**
 * Starts a worker thread, for listening on-chain wallet events
 * @param data the wallet and tracking data
 * @param rpcInfo rpc details
 */
async function startWalletListeningThread(userId: string, data: WalletTrackingData, rpcInfo: RPCDetails) {
  const workerData = { userId: userId, trackingData: data, rpcDetails: rpcInfo }
  //   // see if it exists already, otherwise create a new one
  const id = buildWorkerIdentifier(userId, data.wallet, data.network)
  console.log('worker thread id: ', id)

  console.log('startWalletListeningThread with workerData: ', workerData)
  
  let worker = workers[id] // no worker for this network and wallet
  if(worker) {
    console.log(`Worker with ID: ${id} already exists, skipping!`)
    return
  }
  
  worker = new Worker('./dist/crypto/walletTrackerThread.js', {
    workerData
  })

  workers[id] = worker
  
    // listens from child when the crawling actually starts
  worker.on('message', (event: any) => {
    console.log('got worket message: ', event.method)
    if (event.data) {

      const data = event.data
      if(event.method === CRAWLING_MESSAGES.TRACKING_WALLET_STARTED) {
        console.log('MAIN, Listened CRAWLING_MESSAGES.TRACKING_WALLET_STARTED with data: ', data)
      } 
      if(event.method === TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS) {
        console.log('LISTENED FOUND_WALLET_TRANSACTIONS with data: ', data)
        CryptoPulseWebsocketServer.getInstance().sendWebsocketsMessageToClient(JSON.stringify(data))
      }
      if(event.method === TRANSACTION_EVENTS.FOUND_NATIVE_TRANSACTIONS) {
        console.log('LISTENED FOUND_NATIVE_TRANSACTIONS with data: ', data)
        if(data.amount > WHALES_TREESHOLD.WHALE_NATIVE_TRANSFER) {
          // console.log('whale')
        }
      }

    }
  })

  // TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS

  // Instruct the worker thread to actually start the crawling process
  worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_WALLET })

}

// ################################################################################################
// ################################### START TOKEN THREAD #########################################
// ################################################################################################
async function startTokenListeningThread(userId: string, data: TokenTrackingData, rpcInfo: RPCDetails) {
  const workerData = { userId: userId, trackingData: data, rpcDetails: rpcInfo }
  //   // see if it exists already, otherwise create a new one
  const id = buildWorkerIdentifier(userId, data.token, data.network)
  console.log('worker thread id: ', id)

  console.log('startTokenListeningThread with workerData: ', workerData)
  
  let worker = workers[id] // no worker for this network and wallet
  if(worker) {
    console.log(`Worker with ID: ${id} already exists, skipping!`)
    return
  }
  
  worker = new Worker('./dist/crypto/tokenTrackerThread.js', {
    workerData
  })

  workers[id] = worker
  
    // listens from child when the crawling actually starts
  worker.on('message', (event: any) => {
    console.log('got worker message: ', event.method)
    if (event.data) {

      const data = event.data
      if(event.method === CRAWLING_MESSAGES.TRACKING_TOKEN_STARTED) {
        console.log('MAIN, Listened CRAWLING_MESSAGES.TRACKING_TOKEN_STARTED with data: ', data)
      } 
      if(event.method === TRANSACTION_EVENTS.FOUND_TOKEN_TRANSACTIONS) {
        console.log('LISTENED FOUND_TOKEN_TRANSACTIONS with data: ', data)
        CryptoPulseWebsocketServer.getInstance().sendWebsocketsMessageToClient(JSON.stringify(data))
      }
      if(event.method === TRANSACTION_EVENTS.FOUND_NATIVE_TRANSACTIONS) {
        console.log('LISTENED FOUND_NATIVE_TRANSACTIONS with data: ', data)
        if(data.amount > WHALES_TREESHOLD.WHALE_NATIVE_TRANSFER) {
          // console.log('whale')
        }
      }

    }
  })

  // TRANSACTION_EVENTS.FOUND_WALLET_TRANSACTIONS

  // Instruct the worker thread to actually start the crawling process
  worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_TOKEN })

}

async function getAddressFullTransactionHistory(address: string, chainId: number) {

  // var address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  let fullTransactions = []
  let nextBlock = 0

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
  while (true) {
      const requestTransactions = await axios.get(`https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${nextBlock}&endblock=latest&page=1&offset=1000&sort=asc&apikey=${ETHERSCAN_API_KEY}`)
      const transactions = await requestTransactions.data

      nextBlock = Number(transactions.result[transactions.result.length - 1].blockNumber)

      transactions.result.forEach((tx: any) => {
          if (tx.blockNumber != nextBlock || transactions.result.length != 1000) {
            console.log('pushing transaction: ', tx.hash)
              fullTransactions.push(tx.hash);
          }
      })

      if (transactions.result.length < 1000) break

  }

  console.log(`Retrieved ${fullTransactions.length} transactions for ${address}`)

}

async function listenForERC20TransferEvents(tokenContractAddresses: string[], rpcDetails: RPCDetails) {
  // async function getTransfer(){
    // const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; ///USDC Contract

    const blockChainHandler = new BlockchainTracking(rpcDetails.rpc,rpcDetails.network.chainName,rpcDetails.network.chainId)

    const provider = blockChainHandler.getProvider() // new ethers.WebSocketProvider('wss://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
   //);
    // const provider = new ethers.JsonRpcApiProvider(
    //    'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
    //  );
    //  const provider = new ethers.JsonRpcProvider( 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6', undefined, {
    //   staticNetwork: ethers.Network.from(rpcDetails.network.chainId)
    // })
    // const provider = blockChainHandler.getProvider()
    console.log('provider ', provider)
    for(const tokenAddress of tokenContractAddresses) {
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      console.log('decimals:', await contract.decimals())
      const decimals = Number(contract.decimals)
      console.log('contract ',contract)
      contract.on("Transfer", (from, to, value, eventData)=>{ // from, to, value, event
  
        console.log('from: ', from)
        console.log('to: ', to)
        console.log('value: ', value)
        console.log('eventData: ', eventData)
          let transferEvent = {
              from: from,
              to: to,
              value: value,
              eventData: eventData,
          }
       console.log('transfer event detected:', transferEvent)
       console.log('transfer event logs:', transferEvent.eventData.log)
       console.log('value: ', ethers.formatUnits(transferEvent.value, decimals))
      })
    }
    
 //}
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
async function listenForWalletTransferEvents(walletAddresses: string[], rpcDetails: RPCDetails) {
  /**
   * Filters are short-lived. A given filter expires if it's not utilized within 5 minutes. 
   * You need to make sure that you request eth_getFilterChanges before the filter expires. 
   * As long as you periodically poll eth_getFilterChanges within 5 minutes timeframes, the filter will not expire.
  */

    const blockChainHandler = new BlockchainTracking(rpcDetails.rpc,rpcDetails.network.chainName,rpcDetails.network.chainId)

    // const provider = new ethers.WebSocketProvider('wss://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6')
    // blockChainHandler.getProvider() // 
    // );
    // const provider = new ethers.JsonRpcProvider(
    //     'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6'
    //   );
    // //  const provider = new ethers.JsonRpcProvider( 'https://eth-mainnet.g.alchemy.com/v2/z69jwBaGZY89MDgx7qm9na2ccexiudH6', undefined, {
    // //   staticNetwork: ethers.Network.from(rpcDetails.network.chainId)
    // // })
    const provider = blockChainHandler.getProvider()
    console.log('provider ', provider)
    console.log('Will filter transfer events for (from/to) wallet(s): ', walletAddresses)

    for(const address of walletAddresses) {
      const filter = {

        // ERC20 Transfer(address indexed from, address indexed to, uint256 value) 3rd topic not indexed
        //ERC721 Transfer(address indexed from, address indexed to, uint256 indexed tokenId) all 3 indexed
        topics: [
          EVENT_HASHES.Transfer.hash, //ethers.id('Transfer(address, address, uint256)'),
          //address lists
          [
            ethers.zeroPadValue(address,32)
            // from
          ],
          [
            ethers.zeroPadValue(address,32)
          ] // to
        ]
      }
  
      provider.on(filter, (data) => {
        console.log(`Got wallet ${address} transfer data:`, data)
      })
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
}

export async function getLiveLogs(rpcDetails: RPCDetails) {
  const blockChainHandler = new BlockchainTracking(rpcDetails.rpc,rpcDetails.network.chainName,rpcDetails.network.chainId)
  const provider = blockChainHandler.getProvider()
  const currentBlock = await getNetworkHeight(provider)
  const beforeBlock = currentBlock - 3
  const logs: ethers.Log[] = await provider.getLogs({
    fromBlock: beforeBlock,
    toBlock: currentBlock,
    topics: [ethers.id('Transfer(address,address,uint256)')],
  });
  // const formatted: BlockchainLogs[] = [... logs]
  console.log('got live logs: ', logs[1])

  const data = await provider.getTransactionReceipt(logs[1].transactionHash)
  console.log('final data: ', data)
  await sleep(3000)
  // process.exit(0)
}

// 0xb3fa6655717101ba052f3a85b2153c7d9ae2916960fc757c92b7e94242f405c4

//TODO for internal transfers the way to do it is check balance changes after each block for the given account

export function processReindexToken(userId: string, tokenData: TokenTrackingData): boolean {
  const id = buildWorkerIdentifier(userId, tokenData.token, tokenData.network)
  console.log('worker thread id: ', id)
  
  let worker = workers[id] // no worker for this network and wallet
  if(worker) {
    worker.postMessage({ method: CRAWLING_MESSAGES.START_TRACKING_WALLET })
    return true
  }
  return false
}