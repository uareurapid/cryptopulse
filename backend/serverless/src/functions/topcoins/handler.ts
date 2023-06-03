//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import { CoinModel } from 'src/models/CoinModel';
//import schema from './schema';

// CoinGecko API endpoint to get cryptocurrency market data
const API_ENDPOINT = 'https://api.coingecko.com/api/v3';

const top10Coins = async (event) => {

  try {
    let top10 = await fetchTop10CoinsFromCoinmarketcap();//fetchCryptoRankings();
    return {
      statusCode: 200,
      body: JSON.stringify(top10),
    };
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

async function fetchTop10CoinsFromCoinmarketcap(): Promise<any> {

  try {
    const response: any = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY,
      },
    });

    if(response) {
      console.log("coinmarketcap: reponse",response);
      return response.data;
    }
  }catch(ex) {
    return null;
  }
}

// Function to fetch the top cryptocurrencies by market cap
async function fetchCryptoRankings(): Promise<CoinModel[]> {
  console.log("get top 10 coins...");
  const response = await axios.get(`${API_ENDPOINT}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
  const data = await response.data;
  console.log('top 10 data is: ',data);
  return data;
}

export const main = middyfy(top10Coins);
