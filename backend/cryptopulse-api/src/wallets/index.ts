

//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';

import { WalletEntity, WalletTrackingData, WalletTrackingPayload } from '../models/Wallets.js';


//const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
//const AWS_SECRET_ACCESS_KEY= process.env.AWS_SECRET_ACCESS_KEY as string;


//https://www.npmjs.com/package/@aws-sdk/client-dynamodb
//https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_GetItem_section.html
// Setup: npm install alchemy-sdk
import { Alchemy, Network, TokenBalancesResponseErc20 } from "alchemy-sdk";
import { AlchemyTokenBalance } from '../models/AlchemyTokenBalance.js';

export * from './service.js'

const ALCHEMY_API_KEY: string = process.env.ALCHEMY_API_KEY as string; 
/*import schema from './schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  return formatJSONResponse({
    //${event.body.name}
    message: `Hello Paulo, welcome to the exciting Serverless world!`,
    event,
  });
};

export const main = middyfy(hello);*/

import express, { Request, Response }from 'express'
// import { TokenTrackingData, TokenTrackingPayload } from '../models/TokenTrakingPayload';
import { START_TRACKING_EVENTS } from '../utils/Constants.js';
import { getDefaultChunkSize, getStartBlockFromNetworkHeight, isDefined, isSupportedNetwork } from '../utils/util.js';
import { startListeningSingleWallet } from '../crypto/blockchainTracking.js';
import EventEmitter from 'node:events';
import { getExistingWallet, getTrackedWallets, updateOrCreateWalletTracking, updateWalletLabel } from './service.js';
import { isAddress } from 'ethers';


//might depend on subscription/account type
const LIMIT_TRANSACTIONS = 50;

export const walletsRoutes = express.Router()

export const WALLETS_API_BASE_PATH = '/api/wallets'

export const WALLETS_EVENT_EMITTER = new EventEmitter()

walletsRoutes.post(
  `${WALLETS_API_BASE_PATH}/track_wallet`,
  async (req: Request, res: Response) => {

  try {

    console.log("got body:", req.body);
    /**
     * {
        user_id: 'paulo_cristo',
        wallet: '0x87b70ea25ff45033e9234c3ca1d78b6e94e15004'
        }
     */

    const payload: WalletTrackingPayload = req.body as WalletTrackingPayload; //wallet to get logs for
    

    console.log("Will start tracking wallet for wallet: ", payload);  

    // first check if is supported or not
    const supported = await isSupportedNetwork(payload.data.network)
    if(!supported) {
      res.status(500).send(`Chain ${payload.data.network} is either not valid or not supported`)
      return
    }

    const userId = payload.user_id as string
    if(!userId) {
      res.status(400).send(`Missing "user_id"`)
      return
    }

    // then check if we are already tracking this one
    const existingData = await getTrackedWallets(userId) // {wallets: WalletTrackingData[]}

    console.log('Get existing tracking data response', existingData);

    let existingItems: WalletTrackingData[] = existingData.wallets
    let existsUserIdKey: boolean = existingItems.length > 0 ? true: false;
    let existsWallet = false;

    if(existsUserIdKey) {
      //check if we are already tracking this wallet address for this very same network
      console.log('check if we are already tracking this wallet address for this very same network')
      //not that evm based chains can have equal address on different chains
      existsWallet = (existingItems.filter( (elem) => (elem.wallet === payload.data.wallet) && (elem.network === payload.data.network) ) ).length > 0;
    }

    //[{"wallet":"0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88","network":"ethereum"},{"wallet":"0x189647e0c97aeeadb1bf744206ce5bf76be79b19","network":"ethereum"}]

    if(existsWallet) {
      const body =
          {
            exists: existsWallet, //indicates it exists
            wallet: payload.data.wallet, //the same data that was sent in the request
            network: payload.data.network
          }
      res.json(body)
      return
    } else {

        console.log("Its an update, adding another wallet/network set to same user id ", userId);

        let newItem: WalletTrackingData = { wallet: payload.data.wallet, network: payload.data.network};
        
        // get block number
        // add it to the DB schema
        // start tracking this new wallet
        // got to check the running threads, and if there is one for this network, add the wallet
        
        const block: number = await getStartBlockFromNetworkHeight(supported)
        newItem.start_block = block // if is -1 means we cannot get the provider network height, need to re-check later
        newItem.last_block = -1 // means no last block
        newItem.current_balance = 0, // no balance, will check later
        newItem.chunk_size = getDefaultChunkSize()
       
        const response = await updateOrCreateWalletTracking(payload.user_id, newItem)
        if(response) {
          // emit an event for the crawling, if a worker already exists use it, otherwise create a new worker
          // when its already running
          // need to check if any thread for this user is already running, otherwise just call the method directly
          WALLETS_EVENT_EMITTER.emit(START_TRACKING_EVENTS.START_TRACKING_WALLET, {
            data: newItem,
            user_id: userId
          })
          //its an inser or update instead
          startListeningSingleWallet(newItem, userId, supported)
        }
        res.json({added: response === true, data: payload})
        
    }

    
   
  }catch(ex: any) {

    console.error("got error", ex);
    res.status(500).send(ex.message)
    
  }
  
})

walletsRoutes.get(
    `${WALLETS_API_BASE_PATH}/tracked_wallets`,
    async (req: Request, res: Response) => {

  try {

    const {user_id } = req.query; //user id, to know what he is tracking in terms of tokens

    console.log("Will get tracked tokens for user id: ", user_id);

    if(!user_id) {
      res.status(400).send("Invalid or missing parameters")
    }

    const data = await getTrackedWallets(user_id as string)
    console.log('will send wallet data: ', data)
    res.json(data)

    //TODO THIS IS FINE!!!!
    // console.log("Getting history for token: ", token);
    // let tokenOperations = await getTokenHistory(token);
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify(tokenOperations),
    // };

  }catch(ex:any) {

    console.error("got error", ex);
    res.status(500).send(ex.message)
    
  }
}
)


// Get existing tracking data response {
//   '$metadata': {
//     httpStatusCode: 200,
//     requestId: 'BOLPTMJ7695QCE8SJUGFE2MLVBVV4KQNSO5AEMVJF66Q9ASUAAJG',
//     extendedRequestId: undefined,
//     cfId: undefined,
//     attempts: 1,
//     totalRetryDelay: 0
//   },
//   Item: undefined
// }
// response: {
//   '$metadata': {
//     httpStatusCode: 200,
//     requestId: '7USE7MNHHIVODLVGH8PGN19KC3VV4KQNSO5AEMVJF66Q9ASUAAJG',
//     extendedRequestId: undefined,
//     cfId: undefined,
//     attempts: 1,
//     totalRetryDelay: 0
//   },
//   Attributes: undefined,
//   ItemCollectionMetrics: undefined
// }

walletsRoutes.get(
    `${WALLETS_API_BASE_PATH}/wallet_tokens`,
    async (req: Request, res: Response) => {
        // Wallet address
  const address: string = req.params.address;

  try {
    console.log("Getting wallet ERC20 tokens for wallet: ", address);
    let tokens = await fetchWalletTokens(address);//fetchCryptoRankings();
    res.json(tokens)
  }catch(ex: any) {

    console.error("got error", ex);
    res.status(500).send(ex.message)
  }
    
})


async function fetchWalletTokens(address: string): Promise<AlchemyTokenBalance[]> {

  const config = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  };
  const alchemy = new Alchemy(config);

  const result: AlchemyTokenBalance[] = [];
  
    // Wallet address
    //const address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
  
    // Get token balances
    const balances: TokenBalancesResponseErc20 = await alchemy.core.getTokenBalances(address);
  
    // Remove tokens with zero balance
    const nonZeroBalances = balances.tokenBalances.filter((token:any) => {
      return token.tokenBalance !== "0";
    });
  
    console.log(`Token balances of ${address} \n`);
  
    // Counter for SNo of final output
    let i = 1;
  
    // Loop through all tokens with non-zero balance
    for (let token of nonZeroBalances) {
      // Get balance of token
      let balance: number =  Number(token.tokenBalance);
  
      // Get metadata of token
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
  
      // Compute token balance in human-readable format
      balance = balance / Math.pow(10, metadata.decimals ? metadata.decimals : 18); // defaults to 18 decimals if no info is there
      let balanceAsNumber: string = balance.toFixed(2);

      const data: AlchemyTokenBalance = {
        token_name: metadata.name || 'no_name',
        token_address: token.contractAddress,
        token_balance: balance,
        token_symbol: metadata.symbol || 'no_symbol'
      }
      result.push(data)
  
      // Print name, balance, and symbol of token
      console.log(`${i++}. ${metadata.name}: ${balanceAsNumber} ${metadata.symbol}`);
    }

    return result;
}

walletsRoutes.post(
  `${WALLETS_API_BASE_PATH}/label_wallet`,
  async (req: Request, res: Response) => {

  try {

    console.log("got body:", req.body);
    /**
     * {
        user_id: string
        network: string
        wallet: string
        label: string 
        }
     */

  const payload: WalletEntity = req.body as WalletEntity; //wallet to get logs for
  if(!payload.wallet || !isAddress(payload.wallet)) {
    res.status(400).send('Missing or invalid paramaters!')
  }
  const walletData = await getExistingWallet(payload.user_id,payload.wallet,payload.network)
  if(!walletData) {
    res.status(404).send('That wallet does not exist!')
  } else {
    const update = await updateWalletLabel(payload.user_id, payload.wallet,payload.network, payload.label) 
    res.status(200).send('Updated: ' + update)
  }
  }catch(error: any) {
    res.status(500).send(error.message)
  }
})
