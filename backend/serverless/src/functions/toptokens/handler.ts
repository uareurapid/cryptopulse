//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import { ethers } from 'ethers';
const ABI = require('src/utils/ERC20ABI');


async function getTop50Tokens() {
  
  let apiKey = process.env.ETHPLORER_API_KEY as string;
  console.log("API KEY: " + apiKey);
  let response = await axios.get(`https://api.ethplorer.io/getTopTokens?apiKey=${apiKey}`);
  console.log(response);
  if(response.data && response.data.tokens) {
    return response.data.tokens;
  }
  return [];
} 

const top50Tokens = async (event) => {

  try {

    let top50 = await getTop50Tokens();
    console.log("Server call top 50 tokens returned:", top50);
    return {
      statusCode: 200,
      body: JSON.stringify(top50),
    };
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};


export const main = middyfy(top50Tokens);
/**
 * Make sure to replace <INFURA_API_KEY> with your actual Infura API key and <TOKEN_ADDRESS> with the contract address of the ERC20 token you want to analyze.

This example connects to the Ethereum mainnet using the Infura provider, retrieves the total supply of the token, iterates over each token holder to get their balance, sorts the token holders based on their balance, and finally logs the top 10 holders' addresses and balances.

Note that this example assumes the ERC20 token implements the balanceOf(address) function to get the balance of a specific address. You may need to modify the ABI or contract method if the token contract has a different interface.

 */