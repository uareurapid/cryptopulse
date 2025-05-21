import { RPCDetails } from "../types/common.js"

//Each item of the WalletTrackingDBModel wallets array
export interface WalletTrackingData {
    _id?: any
    network: string
    wallet: string
    label?: string // add a label to a wallet address 
    start_block?: number
    last_block?: number
    current_balance?: number
    chunk_size?: number
    
}

export interface WalletEntity {
    user_id: string
    network: string
    wallet: string
    label: string    
}

// for the threads
export interface WalletCrawlingData {
    walletData: WalletTrackingData
    rpcDetails: RPCDetails
}

//POST request
export interface WalletTrackingPayload {
    user_id: string,
    data: WalletTrackingData
}

export interface TrackedWalletsAPIResponse {
    wallets: WalletTrackingData[]
}