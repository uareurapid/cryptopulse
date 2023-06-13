//was the token going inside the wallet or outside?
export const ERC20TransferDirection = {
   DIRECTION_IN: "IN",
   DIRECTION_OUT: "OUT"
}

//data we save about the transfer
export type ERC20Transfers = {
    hash: string;
    token_name: string;
    token_address: string;
    value: number;
    block: number; //block to get the timestamp
    direction: string ;//ERC20TransferDirection
}

//
export type WalletTrackingData = {
    wallet: string,
    network: string
}
//POST request
export type WalletTrackingPayload = {
    user_id: string,
    data: WalletTrackingData
}

export type WalletTrackingDBModel = {
    user_id: string,
    wallets: WalletTrackingData[]
}

//the history is an array of transfers
export type ERC20TransferHistory = {

    data: WalletTrackingPayload; //the user doing the history tracking
    records: ERC20Transfers []
}
//https://www.npmjs.com/package/@aws-sdk/client-dynamodb