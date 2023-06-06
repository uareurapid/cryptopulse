//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import { ethers } from 'ethers';
const ABI = require('src/utils/ERC20ABI');



const top10Holders = async (event) => {

  try {
    let address: string = event.body.address;
    console.log("Will get top10Holders fro token: " + address);
    let top10 = await getTopTokenHoldersERC20(address);//PEPE '0x6982508145454ce325ddbe47a25d4ec3d2311933'
    //fetchCryptoRankings();
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

//ethplorer /getTopTokenHolders/{address}
/**
 * 
 * @param addressToken {
    holders: [
        {
            address:   # address of the holder,
            balance:   # token balance,
            share:     # share of the holder in percent
        },
        ...
    ]
}
 * @returns 
 */

async function getTopTokenHoldersERC20(addressToken: string): Promise<any> {
  const apiKey: string = process.env.ETHPLORER_KEY as string;
  let response = await axios.get(`https://api.ethplorer.io/getTopTokenHolders/${addressToken}?apiKey=${apiKey}`);
  console.log(response);
  if(response.data && response.data.holders) {
    return response.data.holders;
  }
  return [];
}


async function getTopTokenHoldersERC721() {

  // Provider and contract setup
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/94b470d62888406699d2d8c5adcb6bbf');
  const tokenAddress = '0x6982508145454ce325ddbe47a25d4ec3d2311933'; // Replace with the actual token contract address PEPE
  const abi = ['function balanceOf(address) view returns (uint256)'];
  // Connect to the contract
  const contract = new ethers.Contract(tokenAddress, ABI, provider);

  // Get the total supply of the token
  const totalSupply = await contract.totalSupply();

  console.log('totalSupply is' + totalSupply)

  // Create an array to store the token holders and their balances
  const tokenHolders = [];

  // Iterate over the total supply to find token holders (only for ERC721)
  for (let i = 0; i < totalSupply; i++) {
    const holderAddress = await contract.tokenByIndex(i);
    const balance = await contract.balanceOf(holderAddress);

    tokenHolders.push({ address: holderAddress, balance: balance.toString() });
  }

  // Sort the token holders based on their balance
  tokenHolders.sort((a, b) => b.balance - a.balance);

  // Get the top 10 token holders
  const top10Holders = tokenHolders.slice(0, 10);

  // Log the top 10 holders' addresses and balances
  for (const holder of top10Holders) {
    console.log('Address:', holder.address, 'Balance:', holder.balance);
  }

  return top10Holders;
}

export const main = middyfy(top10Holders);
/**
 * Make sure to replace <INFURA_API_KEY> with your actual Infura API key and <TOKEN_ADDRESS> with the contract address of the ERC20 token you want to analyze.

This example connects to the Ethereum mainnet using the Infura provider, retrieves the total supply of the token, iterates over each token holder to get their balance, sorts the token holders based on their balance, and finally logs the top 10 holders' addresses and balances.

Note that this example assumes the ERC20 token implements the balanceOf(address) function to get the balance of a specific address. You may need to modify the ABI or contract method if the token contract has a different interface.

 */