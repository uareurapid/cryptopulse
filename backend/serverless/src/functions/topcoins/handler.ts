//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
//import schema from './schema';

// CoinGecko API endpoint to get cryptocurrency market data
const API_ENDPOINT = 'https://api.coingecko.com/api/v3';

const top10Coins = async (event) => {

  let top10 = await fetchCryptoRankings();
  return {
    statusCode: 200,
    body: JSON.stringify(top10),
  };
};

// Function to fetch the top cryptocurrencies by market cap
async function fetchCryptoRankings(): Promise<any[]> {
  console.log("get top 10 coins...");
  const response = await axios.get(`${API_ENDPOINT}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
  const data = await response.data;
  console.log('top 10 data is: ',data);
  return data;
}

export const main = middyfy(top10Coins);
