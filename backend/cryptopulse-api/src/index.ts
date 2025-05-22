
import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import { coinsRoutes } from './coins/index.js';
import { tokensRoutes } from './tokens/index.js';
import bodyParser from 'body-parser';
import { walletsRoutes } from './wallets/index.js';
import { CryptoPulseWebsocketServer } from './ws/websocket.js';
import { scheduleCronJobs } from './cron/scheduleCronJobs.js';
import { startListeningTokens, startListeningWallets } from './crypto/blockchainTracking.js';
import { chainsRoutes } from './chains/index.js';
import { CryptoPulseDatabase, TABLES } from './db/database.js';
import { listenBTCNewBlocks } from './crypto/btcBlockListener.js';
import { isSupportedNetwork } from './utils/util.js';

dotenv.config();

const app: Express = express();
const port = 3000// process.env.PORT;
const httpRoutes = express.Router()

export const rootEndpointRoutes = express.Router()

rootEndpointRoutes.get('/', async (req, res) => {
  res.status(200).send('Crypto Pulse 0.0.1')
})

httpRoutes.use(coinsRoutes)
httpRoutes.use(rootEndpointRoutes)
httpRoutes.use(tokensRoutes)
httpRoutes.use(walletsRoutes)
httpRoutes.use(chainsRoutes)

app.use(cors())
app.use(bodyParser.json())
app.use('/', httpRoutes);

app.listen(port, () => {
  console.log('[server]: Express Typescript Server is running at http://localhost:' + port);
});


const websocket = CryptoPulseWebsocketServer.getInstance()
websocket.setupWebsocketsServer()
// scheduleCronJobs()
const database = CryptoPulseDatabase.getInstance()
console.log('database: ', database)

// database.getCollection(TABLES.USERS).then( (usersCollection) => {
//   console.log('users? :', usersCollection)
// // database.getAllCollections().then(collections => {
// //   console.log('All collections: ', collections)
// })

//sleep(10000)

// startListeningWallets('paulo_cristo')
startListeningTokens('paulo_cristo')
listenBTCNewBlocks()




