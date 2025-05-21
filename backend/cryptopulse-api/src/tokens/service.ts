import { processReindexToken } from "../crypto/blockchainTracking.js";
import { CryptoPulseDatabase, TABLES } from "../db/database.js";
import { TokenTrackingDBModel, TokenTransfersDBModel } from "../models/DBModels.js";
import { ERC20Transfers } from "../models/ERC20TransferHistory.js";
import { TokenTrackingData, TrackedTokensAPIResponse } from "../models/Tokens.js";

export async function getTrackedTokens(user_id: string): Promise<TrackedTokensAPIResponse> {
    try {
        console.log("Will start getting info about tracked tokens for user id: ", user_id);  
        console.log('region: ', process.env.AWS_REGION as string)
        console.log('access key: ', process.env.AWS_ACCESS_KEY_ID)
        console.log('AWS_SECRET_ACCESS_KEY: ', process.env.AWS_SECRET_ACCESS_KEY)

        console.log("Will start getting info about tracked tokens for user id: ", user_id);  

        const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING)
        const filter = {user_id: user_id}
        if(await collection.countDocuments(filter) === 0) {
            console.log('No token data yet for user: ', user_id) 
            return { tokens: []} // TODO return empty array instead???
        }
        const allTokens = await collection.find(filter)
        console.log('all tokens: ', allTokens)

        let existingItems: TokenTrackingData[] = []
        while (await allTokens.hasNext()) {
          const trackedTokens: TokenTrackingDBModel = await allTokens.next() as unknown as TokenTrackingDBModel
          console.log('got docs: ', trackedTokens)
          existingItems = trackedTokens.tokens
        }

        return {tokens: existingItems}
        
    } catch(error) {
        console.error(error)
        return {tokens: []}
    } 
}

export async function updateOrCreateTokenTracking(userId: string, tokenData: TokenTrackingData): Promise<boolean> {
  // Specifying a Schema is optional, but it enables type hints on
  // finds and inserts
  // const haiku = database.collection<Haiku>("haiku");
  try {
    const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING)
    const filter = {user_id: userId}
    const count = await collection.countDocuments(filter)
      if( count === 0) {
        console.log('No data yet for user: ', userId) 
        const data2Insert: TokenTrackingDBModel = {
          user_id: userId,
          tokens: [tokenData] 
        }
        const result = await collection.insertOne(data2Insert)
        console.log(`A TokenTrackingData document was inserted with the _id: ${result.insertedId}`);
        return true
      } else if( count === 1) {
        const userTokens = await collection.find(filter)
        if(await userTokens.hasNext()) {
          const toUpdate = await userTokens.next() as unknown as TokenTrackingDBModel
          console.log('to: update: ', toUpdate)
          toUpdate.tokens.push(tokenData)
          console.log('to upadte after: ', toUpdate)
          const result = await collection.updateOne( {_id: toUpdate._id}, {$set: {tokens: toUpdate.tokens}}, /* Set the upsert option to insert a document if no documents
            match the filter */
            { upsert: true })
            // Print the number of matching and modified documents
          console.log(
            `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
          );
          return true
        }
      }
      // something is wrong
      return false
  }catch(err) {
    console.log('error tracking new token: ', err)
    return false
  }
}

export async function getExistingToken(user_id: string, tokenAddress: string, network: string): Promise<TokenTrackingData | null> { // the logged in user

  try {
    console.log("Will start getting info about tracked tokens for user id: ", user_id);  

    const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING)
    const filter = {user_id: user_id}
    if(await collection.countDocuments(filter) === 0) {
        console.log('No token data yet for user: ', user_id) 
        return null
    }
    const allTokens = await collection.find(filter)
    // console.log('all tokens: ', allTokens)

    let existingItems: TokenTrackingData[] = []
    while (await allTokens.hasNext()) {
      const trackedTokens: TokenTrackingDBModel = await allTokens.next() as unknown as TokenTrackingDBModel
      console.log('got docs: ', trackedTokens)
      existingItems = trackedTokens.tokens
    }
    
    // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
    const filteredToken = existingItems.filter( (elem) => (elem.token === tokenAddress) && (elem.network === network) )

    return filteredToken.length > 0 ? filteredToken[0] : null

  }catch(err) {
    console.error(err)
    return null
  }
  
}

export async function updateExistingTokenBlock(user_id: string, tokenAddress: string, network: string, balance: number = 0, lastBlock: number): Promise<boolean> { // the logged in user

  try {
    console.log("Will updateExistingTokenBlock for token: " + tokenAddress + ' and network: ' + network + ' and block: ' + lastBlock);  

    const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING)
    const filter = {user_id: user_id}
    if(await collection.countDocuments(filter) === 0) {
        console.log('No token data yet for user: ', user_id) 
        return false
    }
    const allTokens = await collection.find(filter)
    // console.log('all wallets: ', allWallets)

    let existingItems: TokenTrackingData[] = []
    let trackedTokensDBData
    while (await allTokens.hasNext()) {
      trackedTokensDBData = await allTokens.next() as unknown as TokenTrackingDBModel
      // console.log('got docs: ', trackedWalletsDBData)
      existingItems = trackedTokensDBData.tokens
    }
    if(!trackedTokensDBData || existingItems.length === 0) {
      console.log('could not find any TokenTrackingDBModel info for ', user_id)
      return false
    }
    
    // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
    // maybe i can keep it in memory?
    let found = false
    let index = -1
    let elementToUpdate
    for(let i = 0; i < existingItems.length; i++) {
      const elem: TokenTrackingData = existingItems[i]
      if (elem.token === tokenAddress && elem.network === network) {
        elem.last_block = lastBlock
        found = true
        index = i
        elementToUpdate = elem
        break;
      }
    }
    
    if(elementToUpdate && index > -1) {
      existingItems[index] = elementToUpdate
      const result = await collection.updateOne( {_id: trackedTokensDBData._id}, {$set: {tokens: existingItems}}, /* Set the upsert option to insert a document if no documents
        match the filter */
        { upsert: true })
        // Print the number of matching and modified documents
      console.log(
        `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
      );
      return result.modifiedCount === 1
    }
      
    return found

  }catch(err) {
    console.error(err)
    return false
  }
  
}

/**
 * Records tranfer data for
 * @param user_id 
 * @param network 
 * @param transfersData 
 * @returns 
 */
export async function updateTokenTrackingDataWithTransferData(userId: string, token: string, network:string, transfersData: ERC20Transfers[]): Promise<boolean> { // the logged in user

  try {
    console.log("Will updateTokenTrackingDataWithTransferData id: " + userId + ' for token: ' + token);
    console.log('with data: ', transfersData)  
    // const client = new DynamoDBClient({ region: process.env.AWS_REGION as string, endpoint: DB_URL});
    // const docClient = DynamoDBDocumentClient.from(client);

    const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRANSFERS)
    const filter = {user_id: userId, token: token, chain: network}
    const count = await collection.countDocuments(filter)
    if( count === 0) {
      // nothing yet
      console.log('No data yet for user: ', userId) 
      const data2Insert: TokenTransfersDBModel = {
        user_id: userId,
        token: token,
        chain: network,
        records: transfersData
      }
      const result = await collection.insertOne(data2Insert)
      console.log(`A TokenTransfersDBModel document was inserted with the _id: ${result.insertedId}`);
      return true
    } else {
      // only do updates
      const userHistory = await collection.find(filter)
      let toUpdate: TokenTransfersDBModel | null = null
      if(await userHistory.hasNext()) {
        toUpdate = await userHistory.next() as unknown as TokenTransfersDBModel

        // now filter for this specific token and chain combination
          if(toUpdate.token !== token || toUpdate.chain !== network) {
            toUpdate = null
          }
      }

        // found the data relative to the token/network
        if(toUpdate!==null) {

          // this is the corresponding token & network position on the array
          const recordData:ERC20Transfers[] = toUpdate.records

          console.log(`GOOD TO ADD DATA for token ${token} and network ${network}, and transfer data: ${transfersData}`)
          // get the transfer hashes, so we don't put the same tarsnfer data again
          const existingHashes: string[] = recordData.flatMap( (record: ERC20Transfers) => {
            return record.hash
          })
          
          let shouldUpdate = false
          // console.log('existsting transaction hashes are: ', existingHashes)
          for(const newData of transfersData) {
            // if the transaction hash is not there yet, add it now
            if(!existingHashes.includes(newData.hash)) {
              shouldUpdate = true
              // console.log('will add the data to an existing record', newData)
              recordData.push(newData)
            }
          }

          // any updates?
          if(shouldUpdate) {

            // console.log('existingTransferItems before: ',historicData[indexOfItem].records)

            toUpdate.records = recordData

            const result = await collection.updateOne( {_id: toUpdate._id}, {$set: {records: recordData}}, /* Set the upsert option to insert a document if no documents
                  match the filter */
                  { upsert: true })
                  // Print the number of matching and modified documents
                console.log(
                  `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
                );

            // console.log('existingTransferItems after: ',historicData[indexOfItem].records)
            return result.modifiedCount > 0
          }
        }
      }
      console.log('something is wrong, added nothing? for token: ', token)
      return false  

  }catch(err) {
    console.error('Got error on updateTrackingDataWithTransferData', err)
    return false
  }
  
}

export function reindexToken(userId: string, existingToken: TokenTrackingData): boolean {
  return processReindexToken(userId, existingToken)
}