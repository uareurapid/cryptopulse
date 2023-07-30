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
    console.log("Getting top 10 cryptos")
    let top10 = await fetchTop10CryptosFromCoinmarketcap();//fetchCryptoRankings();
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

async function fetchTop10CryptosFromCoinmarketcap(): Promise<any> {

  try {
    const response: any = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY,
      },
    });

    console.log("coinmarketcap: reponse",response);

    if(response) {
      return response.data;
    }
  }catch(ex) {
    console.log("coinmarketcap: reponse",[]);
    return [];
  }
}

async function fetchCryptoInfo(allSlugs: string[]): Promise<any> {

  try {
  
    console.log("will fetchCryptoInfo from ", allSlugs);  
    let slugs = allSlugs.join(',');
    console.log("comma separated: ", slugs);
    console.log("api key: ", process.env.REACT_APP_COINMARKET_API_KEY);
    let url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?slug=${slugs}`;
    const response: any = await axios.get(url, {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY
      },
    });

    console.log("coinmarketcap info: reponse",response);

    if(response) {
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
  const response = await axios.get(`${API_ENDPOINT}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
  const data = await response.data;
  console.log('top 10 data is: ',data);
  return data;
}

export const topCoins = middyfy(top10Coins);
