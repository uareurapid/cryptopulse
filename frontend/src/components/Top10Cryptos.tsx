
import axios from "axios";
import { CoinModel } from "../../../backend/serverless/src/models/CoinModel";
import { useEffect, useState } from "react";
import memoize from "lodash.memoize";
import { invalidateCache } from "../utils/CommonUtils";
import eventBus from "../utils/EventBus";


async function getTop10CryptoRanking(): Promise <any> {
    
    try {
        const url = "http://localhost:3000/dev/topcoins";
        const rankingsData: any = await axios.get(url);
        console.log("Top10 rankings: ", rankingsData);
        //setTop10(rankingsData.data.data);
        return rankingsData.data.data;
        
    }catch(ex) {
        console.error(ex);
        return [];
    }
    //setRankings(rankingsData);

}

const getData = memoize(getTop10CryptoRanking);

//calls CommonUtils
function invalidateTop50TokensCache() {
  invalidateCache(getData);
}

export default function Top10Cryptos() {

   const [top10, setTop10] = useState([]);

   useEffect(() => {

      //getTop10CryptoRanking();
      getData().then( (data) =>  {
        setTop10(data);
        console.log("will dispatch event load-top-10 with data: ", data);
        //let ids: number[] = data.map((elem: any) => elem.id);
        //let str = JSON.stringify(ids);
        //console.log("will set: ", str);
        window.localStorage.setItem("top-10-ids", JSON.stringify(data));
        eventBus.dispatch('load-top-10', { message: "load top 10 cryptos", ids: data });
      });

   },[]);

   if(!top10 || !top10.length) {
    return (
        <div>
            NO DATA!
        </div>
    )
   }
   return (

    <div className="text-align-left">
        {getList()}
    </div>
    
   )

   function getList() {
    let list = top10.map( function(crypto: any, i: number) {
        return <li className="li-no-style" key={i}>{i} {crypto.name} {crypto.symbol}: {crypto.quote.USD.market_cap} USD</li>
    })
    return list;
   }

//    async function getTop10CryptoRanking() {
    
//     try {
//         const url = "http://localhost:3000/dev/topcoins";
//         const rankingsData: any = await axios.get(url);
//         console.log("Top10 rankings: ", rankingsData);
//         setTop10(rankingsData.data.data);
        
//     }catch(ex) {
//         console.error(ex);
//     }

    
//     //setRankings(rankingsData);

//    }
    // Function to display the rankings
//   function displayRankings(rankings: any[]): void {
//     console.log('Top 10 Cryptocurrencies by Market Cap:');
//     if(rankings && rankings.length > 0) {
//         rankings.forEach((crypto, index) => {
//         console.log(`${index + 1}. ${crypto.name} (${crypto.symbol}): $${crypto.market_cap}`);
//       });
//     }
//     else console.log("No Top 10 Cryptoc");
//   }
  
    
}

/**
 * {
    "status": {
        "timestamp": "2023-06-03T17:53:03.889Z",
        "error_code": 0,
        "error_message": null,
        "elapsed": 17,
        "credit_count": 1,
        "notice": null,
        "total_count": 10358
    },
    "data": [
        {
            "id": 1,
            "name": "Bitcoin",
            "symbol": "BTC",
            "slug": "bitcoin",
            "num_market_pairs": 10241,
            "date_added": "2010-07-13T00:00:00.000Z",
            "tags": [
                "mineable",
                "pow",
                "sha-256",
                "store-of-value",
                "state-channel",
                "coinbase-ventures-portfolio",
                "three-arrows-capital-portfolio",
                "polychain-capital-portfolio",
                "binance-labs-portfolio",
                "blockchain-capital-portfolio",
                "boostvc-portfolio",
                "cms-holdings-portfolio",
                "dcg-portfolio",
                "dragonfly-capital-portfolio",
                "electric-capital-portfolio",
                "fabric-ventures-portfolio",
                "framework-ventures-portfolio",
                "galaxy-digital-portfolio",
                "huobi-capital-portfolio",
                "alameda-research-portfolio",
                "a16z-portfolio",
                "1confirmation-portfolio",
                "winklevoss-capital-portfolio",
                "usv-portfolio",
                "placeholder-ventures-portfolio",
                "pantera-capital-portfolio",
                "multicoin-capital-portfolio",
                "paradigm-portfolio",
                "bitcoin-ecosystem"
            ],
            "max_supply": 21000000,
            "circulating_supply": 19391918,
            "total_supply": 19391918,
            "infinite_supply": false,
            "platform": null,
            "cmc_rank": 1,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 27162.723282422925,
                    "volume_24h": 9224137716.04923,
                    "volume_change_24h": -37.4936,
                    "percent_change_1h": -0.37384608,
                    "percent_change_24h": 0.33596203,
                    "percent_change_7d": 1.49214267,
                    "percent_change_30d": -5.76200151,
                    "percent_change_60d": -3.67581364,
                    "percent_change_90d": 21.00339483,
                    "market_cap": 526737302549.4362,
                    "market_cap_dominance": 45.9698,
                    "fully_diluted_market_cap": 570417188930.88,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 1027,
            "name": "Ethereum",
            "symbol": "ETH",
            "slug": "ethereum",
            "num_market_pairs": 6965,
            "date_added": "2015-08-07T00:00:00.000Z",
            "tags": [
                "pos",
                "smart-contracts",
                "ethereum-ecosystem",
                "coinbase-ventures-portfolio",
                "three-arrows-capital-portfolio",
                "polychain-capital-portfolio",
                "binance-labs-portfolio",
                "blockchain-capital-portfolio",
                "boostvc-portfolio",
                "cms-holdings-portfolio",
                "dcg-portfolio",
                "dragonfly-capital-portfolio",
                "electric-capital-portfolio",
                "fabric-ventures-portfolio",
                "framework-ventures-portfolio",
                "hashkey-capital-portfolio",
                "kenetic-capital-portfolio",
                "huobi-capital-portfolio",
                "alameda-research-portfolio",
                "a16z-portfolio",
                "1confirmation-portfolio",
                "winklevoss-capital-portfolio",
                "usv-portfolio",
                "placeholder-ventures-portfolio",
                "pantera-capital-portfolio",
                "multicoin-capital-portfolio",
                "paradigm-portfolio",
                "injective-ecosystem",
                "layer-1"
            ],
            "max_supply": null,
            "circulating_supply": 120236711.59771436,
            "total_supply": 120236711.59771436,
            "infinite_supply": true,
            "platform": null,
            "cmc_rank": 2,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 1891.088518996753,
                    "volume_24h": 3973431269.5847793,
                    "volume_change_24h": -33.4585,
                    "percent_change_1h": -0.43982806,
                    "percent_change_24h": -0.09851918,
                    "percent_change_7d": 3.57271323,
                    "percent_change_30d": 0.57095205,
                    "percent_change_60d": 1.15925363,
                    "percent_change_90d": 20.40535389,
                    "market_cap": 227378264864.3614,
                    "market_cap_dominance": 19.8499,
                    "fully_diluted_market_cap": 227378264864.36,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 825,
            "name": "Tether",
            "symbol": "USDT",
            "slug": "tether",
            "num_market_pairs": 55001,
            "date_added": "2015-02-25T00:00:00.000Z",
            "tags": [
                "payments",
                "stablecoin",
                "asset-backed-stablecoin",
                "avalanche-ecosystem",
                "solana-ecosystem",
                "arbitrum-ecosytem",
                "moonriver-ecosystem",
                "injective-ecosystem",
                "bnb-chain",
                "usd-stablecoin",
                "optimism-ecosystem"
            ],
            "max_supply": null,
            "circulating_supply": 83152494318.89395,
            "total_supply": 86090638895.0229,
            "platform": {
                "id": 1027,
                "name": "Ethereum",
                "symbol": "ETH",
                "slug": "ethereum",
                "token_address": "0xdac17f958d2ee523a2206206994597c13d831ec7"
            },
            "infinite_supply": true,
            "cmc_rank": 3,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 1.0003733327178201,
                    "volume_24h": 14573291297.664886,
                    "volume_change_24h": -28.6866,
                    "percent_change_1h": 0.00015437,
                    "percent_change_24h": -0.00452533,
                    "percent_change_7d": -0.00285767,
                    "percent_change_30d": -0.01077874,
                    "percent_change_60d": 0.01282059,
                    "percent_change_90d": 0.02604615,
                    "market_cap": 83183537865.59155,
                    "market_cap_dominance": 7.2594,
                    "fully_diluted_market_cap": 86122779347.22,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 1839,
            "name": "BNB",
            "symbol": "BNB",
            "slug": "bnb",
            "num_market_pairs": 1443,
            "date_added": "2017-07-25T00:00:00.000Z",
            "tags": [
                "marketplace",
                "centralized-exchange",
                "payments",
                "smart-contracts",
                "alameda-research-portfolio",
                "multicoin-capital-portfolio",
                "bnb-chain",
                "layer-1"
            ],
            "max_supply": null,
            "circulating_supply": 155856066.83663774,
            "total_supply": 155856066.83663774,
            "infinite_supply": false,
            "platform": null,
            "cmc_rank": 4,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 306.9769662860776,
                    "volume_24h": 273388062.7647327,
                    "volume_change_24h": -27.6401,
                    "percent_change_1h": -0.35113091,
                    "percent_change_24h": 0.04156988,
                    "percent_change_7d": 0.63368684,
                    "percent_change_30d": -5.35828378,
                    "percent_change_60d": -1.34212374,
                    "percent_change_90d": 5.54015707,
                    "market_cap": 47844222574.7912,
                    "market_cap_dominance": 4.1753,
                    "fully_diluted_market_cap": 47844222574.79,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 3408,
            "name": "USD Coin",
            "symbol": "USDC",
            "slug": "usd-coin",
            "num_market_pairs": 12802,
            "date_added": "2018-10-08T00:00:00.000Z",
            "tags": [
                "medium-of-exchange",
                "stablecoin",
                "asset-backed-stablecoin",
                "hedera-hashgraph-ecosystem",
                "fantom-ecosystem",
                "arbitrum-ecosytem",
                "moonriver-ecosystem",
                "bnb-chain",
                "usd-stablecoin",
                "optimism-ecosystem"
            ],
            "max_supply": null,
            "circulating_supply": 28907428651.46301,
            "total_supply": 28907428651.46301,
            "platform": {
                "id": 1027,
                "name": "Ethereum",
                "symbol": "ETH",
                "slug": "ethereum",
                "token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
            },
            "infinite_supply": false,
            "cmc_rank": 5,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 0.9999919707069639,
                    "volume_24h": 1922590197.4518182,
                    "volume_change_24h": -34.5995,
                    "percent_change_1h": 0.0021792,
                    "percent_change_24h": -0.00638422,
                    "percent_change_7d": 0.00577837,
                    "percent_change_30d": 0.00891352,
                    "percent_change_60d": 0.01453031,
                    "percent_change_90d": -0.00455659,
                    "market_cap": 28907196545.247444,
                    "market_cap_dominance": 2.5239,
                    "fully_diluted_market_cap": 28907196545.25,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 52,
            "name": "XRP",
            "symbol": "XRP",
            "slug": "xrp",
            "num_market_pairs": 959,
            "date_added": "2013-08-04T00:00:00.000Z",
            "tags": [
                "medium-of-exchange",
                "enterprise-solutions",
                "arrington-xrp-capital-portfolio",
                "galaxy-digital-portfolio",
                "a16z-portfolio",
                "pantera-capital-portfolio"
            ],
            "max_supply": 100000000000,
            "circulating_supply": 51987017573,
            "total_supply": 99988884267,
            "infinite_supply": false,
            "platform": null,
            "cmc_rank": 6,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 0.5196268318363533,
                    "volume_24h": 801002013.576346,
                    "volume_change_24h": -19.6336,
                    "percent_change_1h": -0.43140167,
                    "percent_change_24h": 0.28371862,
                    "percent_change_7d": 10.48520147,
                    "percent_change_30d": 13.46630034,
                    "percent_change_60d": 3.79128911,
                    "percent_change_90d": 40.37145268,
                    "market_cap": 27013849238.078815,
                    "market_cap_dominance": 2.3586,
                    "fully_diluted_market_cap": 51962683183.64,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 2010,
            "name": "Cardano",
            "symbol": "ADA",
            "slug": "cardano",
            "num_market_pairs": 818,
            "date_added": "2017-10-01T00:00:00.000Z",
            "tags": [
                "dpos",
                "pos",
                "platform",
                "research",
                "smart-contracts",
                "staking",
                "cardano-ecosystem",
                "cardano",
                "layer-1"
            ],
            "max_supply": 45000000000,
            "circulating_supply": 34890712013.863,
            "total_supply": 35842779602.84,
            "infinite_supply": false,
            "platform": null,
            "cmc_rank": 7,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 0.376057323099848,
                    "volume_24h": 119976817.90659082,
                    "volume_change_24h": -42.9242,
                    "percent_change_1h": -0.35994367,
                    "percent_change_24h": 0.10898796,
                    "percent_change_7d": 3.37404474,
                    "percent_change_30d": -3.16434928,
                    "percent_change_60d": -4.05179587,
                    "percent_change_90d": 11.25271419,
                    "market_cap": 13120907760.981028,
                    "market_cap_dominance": 1.1451,
                    "fully_diluted_market_cap": 16922579539.49,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 74,
            "name": "Dogecoin",
            "symbol": "DOGE",
            "slug": "dogecoin",
            "num_market_pairs": 718,
            "date_added": "2013-12-15T00:00:00.000Z",
            "tags": [
                "mineable",
                "pow",
                "scrypt",
                "medium-of-exchange",
                "memes",
                "payments",
                "doggone-doggerel",
                "bnb-chain"
            ],
            "max_supply": null,
            "circulating_supply": 139615666383.70526,
            "total_supply": 139615666383.70526,
            "infinite_supply": true,
            "platform": null,
            "cmc_rank": 8,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 0.0725980262223428,
                    "volume_24h": 132971193.4137794,
                    "volume_change_24h": -15.6958,
                    "percent_change_1h": -0.42268138,
                    "percent_change_24h": 0.65393528,
                    "percent_change_7d": 1.66515494,
                    "percent_change_30d": -7.33449045,
                    "percent_change_60d": -24.05331263,
                    "percent_change_90d": -3.61016674,
                    "market_cap": 10135821809.174099,
                    "market_cap_dominance": 0.8845,
                    "fully_diluted_market_cap": 10135821809.17,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 5426,
            "name": "Solana",
            "symbol": "SOL",
            "slug": "solana",
            "num_market_pairs": 468,
            "date_added": "2020-04-10T00:00:00.000Z",
            "tags": [
                "pos",
                "platform",
                "solana-ecosystem",
                "cms-holdings-portfolio",
                "kenetic-capital-portfolio",
                "alameda-research-portfolio",
                "multicoin-capital-portfolio",
                "okex-blockdream-ventures-portfolio",
                "layer-1"
            ],
            "max_supply": null,
            "circulating_supply": 396969650.9914979,
            "total_supply": 549208664.0428379,
            "infinite_supply": true,
            "platform": null,
            "cmc_rank": 9,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 21.135228345656174,
                    "volume_24h": 163336035.99302277,
                    "volume_change_24h": -28.0953,
                    "percent_change_1h": -0.60506188,
                    "percent_change_24h": 0.12938358,
                    "percent_change_7d": 7.56022882,
                    "percent_change_30d": -2.8720946,
                    "percent_change_60d": 0.83575794,
                    "percent_change_90d": -0.45754787,
                    "market_cap": 8390044220.000744,
                    "market_cap_dominance": 0.7322,
                    "fully_diluted_market_cap": 11607650523.96,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        },
        {
            "id": 3890,
            "name": "Polygon",
            "symbol": "MATIC",
            "slug": "polygon",
            "num_market_pairs": 728,
            "date_added": "2019-04-28T00:00:00.000Z",
            "tags": [
                "pos",
                "platform",
                "enterprise-solutions",
                "zero-knowledge-proofs",
                "scaling",
                "state-channel",
                "coinbase-ventures-portfolio",
                "layer-2",
                "binance-launchpad",
                "binance-labs-portfolio",
                "polygon-ecosystem",
                "moonriver-ecosystem",
                "injective-ecosystem"
            ],
            "max_supply": 10000000000,
            "circulating_supply": 9279469069.28493,
            "total_supply": 10000000000,
            "infinite_supply": false,
            "platform": null,
            "cmc_rank": 10,
            "self_reported_circulating_supply": null,
            "self_reported_market_cap": null,
            "tvl_ratio": null,
            "last_updated": "2023-06-03T17:50:00.000Z",
            "quote": {
                "USD": {
                    "price": 0.8988635748695585,
                    "volume_24h": 187481644.21830708,
                    "volume_change_24h": -14.8851,
                    "percent_change_1h": -0.49457161,
                    "percent_change_24h": 0.14541057,
                    "percent_change_7d": -2.45332947,
                    "percent_change_30d": -8.68838302,
                    "percent_change_60d": -21.01144214,
                    "percent_change_90d": -21.12791832,
                    "market_cap": 8340976740.508946,
                    "market_cap_dominance": 0.7283,
                    "fully_diluted_market_cap": 8988635748.7,
                    "tvl": null,
                    "last_updated": "2023-06-03T17:50:00.000Z"
                }
            }
        }
    ]
}
 */