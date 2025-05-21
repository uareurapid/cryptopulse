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
//import schema from './schema';
// CoinGecko API endpoint to get cryptocurrency market data
const COINGECKO_API_ENDPOINT = 'https://api.coingecko.com/api/v3';
export const coinsRoutes = express.Router();
export const COINS_API_BASE_PATH = '/api/coins';
coinsRoutes.get(`${COINS_API_BASE_PATH}/get_top_10`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Getting top 10 cryptos");
        let top10 = yield fetchTop10CryptosFromCoinmarketcap(); //fetchCryptoRankings();
        res.json(top10);
    }
    catch (ex) {
        console.error("got error", ex);
        res.status(500).send(ex.message);
    }
}));
function fetchTop10CryptosFromCoinmarketcap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('key: ', process.env.COINMARKET_API_KEY);
            const response = yield axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY,
                },
            });
            if (response && response.status === 200) {
                // console.log("coinmarketcap: reponse",response.data);
                return response.data;
            }
        }
        catch (ex) {
            console.log("coinmarketcap: reponse", []);
            return [];
        }
    });
}
// Function to fetch the top cryptocurrencies by market cap
function fetchCryptoRankings() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("get top 10 coins...");
        const response = yield axios.get(`${COINGECKO_API_ENDPOINT}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
        const data = yield response.data;
        console.log('top 10 data is: ', data);
        return data;
    });
}
//# sourceMappingURL=index.js.map