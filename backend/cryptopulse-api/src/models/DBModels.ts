import { ERC20Transfers } from "./ERC20TransferHistory.js";
import { TokenTrackingData } from "./Tokens.js";
import { WalletTrackingData } from "./Wallets.js";


// what i have on DB (row)
export interface TokenTrackingDBModel {
    _id?: string,
    user_id: string,
    tokens: TokenTrackingData[]
}

export interface WalletTrackingDBModel {
    _id?: string,
    user_id: string,
    wallets: WalletTrackingData[]
}

export interface WalletTransfersDBModel {
    _id?: string,
    user_id: string,
    wallet: string; //the user doing the history tracking
    chain: string // the chain
    records: ERC20Transfers []
}

export interface TokenTransfersDBModel {
    _id?: string,
    user_id: string,
    token: string; //the user doing the history tracking
    chain: string // the chain
    records: ERC20Transfers []
}

// supported chains
export interface ChainModel {
    _id?: string,
    chain_id: number,
    chain_name: string
}