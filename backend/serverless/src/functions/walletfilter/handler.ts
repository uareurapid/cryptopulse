//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import { CoinModel } from 'src/models/CoinModel';
//import schema from './schema';

import { ethers } from 'ethers';

const INFURA_API_KEY = 'https://api.coingecko.com/api/v3';
// Provider and contract setup
const provider = new ethers.JsonRpcProvider('mainnet', '<INFURA_API_KEY>');
const walletAddress = '<WALLET_ADDRESS>'; // Replace with the Ethereum wallet address you want to monitor
const tokenAddress = '<TOKEN_ADDRESS>'; // Replace with the contract address of the ERC20 token you want to monitor
const abi = ['event Transfer(address indexed from, address indexed to, uint256 value)'];


// CoinGecko API endpoint to get cryptocurrency market data


const walletFilter = async (event) => {

  try {

    const wallet: string = event.body.wallet;
    const token: string  = event.body.token;

    console.log("Getting events for wallet and token")
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

async function startEventListener(): Promise<any> {

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



async function startEventListener() {
  // Connect to the provider
  const provider = new ethers.JsonRpcProvider('mainnet', '<INFURA_API_KEY>');

  // Connect to the contract
  const contract = new ethers.Contract(tokenAddress, abi, provider);

  // Create a filter to listen for Transfer events
  const filter = contract.filters.Transfer(walletAddress, null);

  // Start listening for Transfer events
  contract.on(filter, (from, to, value) => {
    console.log('Transfer event detected:');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Value:', value.toString());
  });
}

startEventListener().catch((error) => console.error(error));

export const main = middyfy(top10Coins);
