import { RPCDetails } from "../types/common.js"

export interface TokenTrackingData {
    _id?: any
    token: string,
    network: string
    start_block?: number
    last_block?: number
    chunk_size?: number
}

export interface TokenTrackingPayload {
    user_id: string,
    data: TokenTrackingData
}

export interface TrackedTokensAPIResponse {
    tokens: TokenTrackingData[]
}

// for the threads
export interface TokenCrawlingData {
    tokenData: TokenTrackingData
    rpcDetails: RPCDetails
}