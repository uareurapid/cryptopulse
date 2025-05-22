import { ethers } from "ethers"
import { RPC } from "../types/common"

export const DB_URL = process.env.DB_URL || 'http://localhost:8000'

export const DEVELOPMENT_CHAIN_ID = 8996
export const SUPPORTED_NETWORKS = {
    ETHEREUM: {chain_name: 'ethereum', chain_id: 1},
    DEVELOPMENT: {chain_name: 'development', chain_id: DEVELOPMENT_CHAIN_ID},
    // most stuff will not apply to btc chain
    BITCOIN: {chain_name: 'bitcoin', chain_id: 0}
}

export const DEFAULT_RPC_PROVIDERS: Record<string, RPC> =  {
    'ethereum': { default: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, fallback: [`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`]},
    'development': { default: 'http://127.0.0.1:8545'}
}
// this.dynamoDB = DynamoDBClient({
//     region: 'us-east-1',
//     endpoint: 'http://localhost:5000/',
//     credentials: {
//       accessKeyId: 'xxx',
//       secretAccessKey: 'yyy',
//     },
//   });

// lets keep it conservative
export const MAX_WALLETS_TO_TRACK = 100
export const MAX_TOKENS_TO_TRACK = 100

export const DEFAULT_CHUNK_SIZE = 100

export const START_TRACKING_EVENTS = {
    START_TRACKING_WALLET: 'START_TRACKING_WALLET', // when a new wallet is added to tracking successsfully 
    START_TRACKING_TOKEN: 'START_TRACKING_TOKEN'    // when a new token is added to tracking successsfully 
}

export const WHALES_TREESHOLD = {
    WHALE_NATIVE_TRANSFER: 10
}

export const TRANSACTION_EVENTS = {
    FOUND_WALLET_TRANSACTIONS: 'FOUND_WALLET_TRANSACTIONS', // when wallet transfers are found
    FOUND_TOKEN_TRANSACTIONS: 'FOUND_TOKEN_TRANSACTIONS',    // when token movements are found
    FOUND_NATIVE_TRANSACTIONS: 'FOUND_NATIVE_TRANSACTIONS'    // when native token/eth movements are found (balance changed)
}

export const EVENT_HASHES = {
//     hash: '0x5463569dcc320958360074a9ab27e809e8a6942c394fb151d139b5f7b4ecb1bd': {
//     type:'Transfer',
//     text: ethers.id('Transfer(address,address,uint256)'
//   },
/**
 * The utils.id function will return the keccak256 hash of the function signature you passed it. 
 * The substring function call is used to extract 0x + first four bytes. 
 * So the final data is the method ID you're looking for.
 * https://docs.ethers.io/v5/api/utils/hashing/#utils-id
 */
    Transfer: { 
        type: 'Transfer', // for both ERC20 and ERC721 (difference will be number of topics 3 and 4)
        hash: ethers.id('Transfer(address,address,uint256)'), // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
        text: 'Transfer(address,address,uint256)',
        method_id: ethers.id('transfer(address,uint256)').substring(0,10) //  '0xa9059cbb'
    },
    TransferSingle: { 
        type: 'TransferSigle', // ERC1155
        hash: ethers.id('TransferSingle(address,address,address,uint256,uint256)'), // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
        text: 'TransferSingle(address,address,address,uint256,uint256)',
        method_id: ethers.id('safeTransferFrom(address, address, uint256, uint256, bytes)').substring(0,10)//'0xa9059cbb'
    },
    // Mint: { // https://www.4byte.directory/event-signatures/?page=126&sort=id
    //     type: 'Mint',
    //     hash: ethers.id('mint(address,uint256)'), // 0x40c10f19c047ae7dfa66d6312b683d2ea3dfbcb4159e96b967c5f4b0a86f2842
    //     text: 'mint(address,uint256)',
    //     method_id: ethers.id('mint(address,uint256)').substring(0,10)//'0x40c10f19'
    // },
    // Burn: { // https://www.4byte.directory/event-signatures/?page=126&sort=id
    //     type: 'Burn',
    //     hash: ethers.id('burn(address,uint256)'), // 0x40c10f19c047ae7dfa66d6312b683d2ea3dfbcb4159e96b967c5f4b0a86f2842
    //     text: 'burn(address,uint256)',
    //     method_id: ethers.id('burn(address,uint256)').substring(0,10)//'0x40c10f19'
    // },
    Approval: { // https://www.4byte.directory/event-signatures/?page=126&sort=id
        type: 'Approval',
        hash: ethers.id('Approval(address,address,uint256)'), // 0x40c10f19c047ae7dfa66d6312b683d2ea3dfbcb4159e96b967c5f4b0a86f2842
        text: 'Approval(address,address,uint256)',
        method_id: ethers.id('approve(address,uint256)').substring(0,10)//'0x40c10f19'
    }
}

export const TRANSACTION_SIGNATURE = 'transfer(address,uint256)'

export const CRAWLING_MESSAGES = {
    START_TRACKING_WALLET: 'START_TRACKING_WALLET',
    START_TRACKING_TOKEN: 'START_TRACKING_TOKEN',
    TRACKING_WALLET_STARTED: 'TRACKING_WALLET_STARTED',
    TRACKING_TOKEN_STARTED: 'TRACKING_TOKEN_STARTED',
    REINDEX_TOKEN_STARTED: 'REINDEX_TOKEN_STARTED'
}