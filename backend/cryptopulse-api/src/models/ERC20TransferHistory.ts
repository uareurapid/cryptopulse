//was the token going inside the wallet or outside?
export enum ERC20TransferDirection {
    DIRECTION_IN = "IN",
    DIRECTION_OUT = "OUT"
 }

export enum ERC20TransactionType {
    MINT = "MINT",
    TRANSFER = "TRANSFER",
    BURN = "BURN"
}

export interface CryptoTransfers {
    hash: string // transaction hash
    value: number // value transfered
    balance_before: number // balance of that token before the transfer
    balance_after:number // balance after th transfer
    block: number //block to get the timestamp
    direction: ERC20TransferDirection//ERC20TransferDirection, IN or OUT
    timestamp: number // block timestamp
    // chain: string // chain name 
    transaction_type: ERC20TransactionType
    counter_part: string // the other side of the transaction
}

//data we save about the transfer
export interface ERC20Transfers extends CryptoTransfers {

    token_name?: string // token name
    token_address?: string // token contract address
    token_symbol?: string // token symbol
}



//https://www.npmjs.com/package/@aws-sdk/client-dynamodb