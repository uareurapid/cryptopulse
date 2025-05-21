var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import axios from 'axios';
import { ethers } from 'ethers';
// TODO change import style
const ABI = require('src/utils/ERC20ABI');
export const holdersRoutes = express.Router();
export const HOLDERS_API_BASE_PATH = '/api/holders';
holdersRoutes.post(`${HOLDERS_API_BASE_PATH}/get_top_10`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let address = req.body.address;
        console.log("Will get top10Holders fro token: " + address);
        let top10 = yield getTopTokenHoldersERC20(address); //PEPE '0x6982508145454ce325ddbe47a25d4ec3d2311933'
        //fetchCryptoRankings();
        res.json(top10);
    }
    catch (ex) {
        console.error("got error", ex);
        res.status(500).send(ex.message);
    }
}));
function getTopTokenHoldersERC20(addressToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.ETHPLORER_API_KEY;
        let response = yield axios.get(`https://api.ethplorer.io/getTopTokenHolders/${addressToken}?apiKey=${apiKey}`);
        console.log(response);
        if (response.data && response.data.holders) {
            return response.data.holders;
        }
        return [];
    });
}
function getTopTokenHoldersERC721() {
    return __awaiter(this, void 0, void 0, function* () {
        // Provider and contract setup
        const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/94b470d62888406699d2d8c5adcb6bbf');
        const tokenAddress = '0x6982508145454ce325ddbe47a25d4ec3d2311933'; // Replace with the actual token contract address PEPE
        const abi = ['function balanceOf(address) view returns (uint256)'];
        // Connect to the contract
        const contract = new ethers.Contract(tokenAddress, ABI, provider);
        // Get the total supply of the token
        const totalSupply = yield contract.totalSupply();
        console.log('totalSupply is' + totalSupply);
        // Create an array to store the token holders and their balances
        const tokenHolders = [];
        // Iterate over the total supply to find token holders (only for ERC721)
        for (let i = 0; i < totalSupply; i++) {
            const holderAddress = yield contract.tokenByIndex(i);
            const balance = yield contract.balanceOf(holderAddress);
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
    });
}
//# sourceMappingURL=index.js.map