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
import dotenv from 'dotenv';
import cors from 'cors';
import { coinsRoutes } from './coins/index.js';
import { tokensRoutes } from './tokens/index.js';
import bodyParser from 'body-parser';
import { walletsRoutes } from './wallets/index.js';
import { CryptoPulseWebsocketServer } from './ws/websocket.js';
import { startListeningTokens } from './crypto/blockchainTracking.js';
import { chainsRoutes } from './chains/index.js';
import { CryptoPulseDatabase } from './db/database.js';
dotenv.config();
const app = express();
const port = 3000; // process.env.PORT;
const httpRoutes = express.Router();
export const rootEndpointRoutes = express.Router();
rootEndpointRoutes.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send('Crypto Pulse 0.0.1');
}));
httpRoutes.use(coinsRoutes);
httpRoutes.use(rootEndpointRoutes);
httpRoutes.use(tokensRoutes);
httpRoutes.use(walletsRoutes);
httpRoutes.use(chainsRoutes);
app.use(cors());
app.use(bodyParser.json());
app.use('/', httpRoutes);
app.listen(port, () => {
    console.log('[server]: Express Typescript Server is running at http://localhost:' + port);
});
const websocket = CryptoPulseWebsocketServer.getInstance();
websocket.setupWebsocketsServer();
// scheduleCronJobs()
const database = CryptoPulseDatabase.getInstance();
console.log('database: ', database);
// database.getCollection(TABLES.USERS).then( (usersCollection) => {
//   console.log('users? :', usersCollection)
// // database.getAllCollections().then(collections => {
// //   console.log('All collections: ', collections)
// })
//sleep(10000)
// startListeningWallets('paulo_cristo')
startListeningTokens('paulo_cristo');
//# sourceMappingURL=index.js.map