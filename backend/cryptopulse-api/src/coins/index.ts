import express, { Request, Response }from 'express'
import axios from 'axios';

import { CoinModel } from '../models/CoinModel.js';
//import schema from './schema';

// CoinGecko API endpoint to get cryptocurrency market data
const COINGECKO_API_ENDPOINT = 'https://api.coingecko.com/api/v3';

export const coinsRoutes = express.Router()

export const COINS_API_BASE_PATH = '/api/coins'

coinsRoutes.get(
  `${COINS_API_BASE_PATH}/get_top_10`,
  async (req: Request, res: Response) => {

    try {
        console.log("Getting top 10 cryptos")
        let top10 = await fetchTop10CryptosFromCoinmarketcap();//fetchCryptoRankings();
        res.json(top10)
      }catch(ex: any) {
    
        console.error("got error", ex);
        res.status(500).send(ex.message)
      }
  }
)

async function fetchTop10CryptosFromCoinmarketcap(): Promise<any> {

    try {
      console.log('key: ',process.env.COINMARKET_API_KEY)
      const response: any = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY,
        },
      });
  
      if(response && response.status===200) {
        // console.log("coinmarketcap: reponse",response.data);
        return response.data;
      }
    }catch(ex) {
      console.log("coinmarketcap: reponse",[]);
      return [];
    }
  }
  
  // Function to fetch the top cryptocurrencies by market cap
  async function fetchCryptoRankings(): Promise<CoinModel[]> {
    console.log("get top 10 coins...");
    const response = await axios.get(`${COINGECKO_API_ENDPOINT}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
    const data = await response.data;
    console.log('top 10 data is: ',data);
    return data;
  }