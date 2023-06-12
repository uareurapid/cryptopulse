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

//the history is an array of transfers
export type ERC20TransferHistory = {

    user_id: string; //the user doing the history tracking
    records: ERC20Transfers []
}
//https://www.npmjs.com/package/@aws-sdk/client-dynamodb