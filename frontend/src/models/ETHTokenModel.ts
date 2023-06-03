//ETHPlorer API

export type ETHPlorerPrice = {
    availableSupply: number;
    bid: number;
    currency: string;
    diff: number;
    diff7d: number;
    diff30d: number;
    marketCapUsd: number;
    rate: number;
    ts: number;
    volDiff1: number;
    volDiff7: number;
    volDiff30: number;
    volume24h: number;

}
export type ETHTokenModel = {
    address: string;
    coingecko: string;
    decimals: string;
    ethTransfersCount: number;
    holdersCount: number;
    image: string;
    name: string;
    opCount: number;
    owner: string;
    price: ETHPlorerPrice;
    symbol: string;
    totalSupply: string;
    transfersCount: number;
    ts: number;
    txsCount: number;
    website: string;
}