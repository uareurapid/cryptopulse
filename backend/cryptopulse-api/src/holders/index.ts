import express, { Request, Response }from 'express'
import axios from 'axios';
import { ethers } from 'ethers';
// TODO change import style
const ABI = require('src/utils/ERC20ABI');

export const holdersRoutes = express.Router()

export const HOLDERS_API_BASE_PATH = '/api/holders'

holdersRoutes.post(
  `${HOLDERS_API_BASE_PATH}/get_top_10`,
  async (req: Request, res: Response) => {
    try {
        let address: string = req.body.address;
        console.log("Will get top10Holders fro token: " + address);
        let top10 = await getTopTokenHoldersERC20(address);//PEPE '0x6982508145454ce325ddbe47a25d4ec3d2311933'
        //fetchCryptoRankings();
        res.json(top10)
      } catch(ex: any) {
    
        console.error("got error", ex);
        res.status(500).send(ex.message)
      }


  }
)

async function getTopTokenHoldersERC20(addressToken: string): Promise<any> {
    const apiKey: string = process.env.ETHPLORER_API_KEY as string;
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