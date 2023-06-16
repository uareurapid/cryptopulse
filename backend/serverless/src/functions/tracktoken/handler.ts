//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import { TokenTrackingData, TokenTrackingPayload } from 'src/models/TokenTrakingPayload';

//might depend on subscription/account type
const LIMIT_TRANSACTIONS = 50;

const walletTracker = async (event) => {

  try {

    const payload: TokenTrackingPayload = event.body; //wallet to get logs for

    const token: string  = payload.data.token;

    console.log("got token: ", token);

    if(!token) {
      return {
        statusCode: 400,
        body: "Invalid or missing parameters"
      }
    }

    
 

    console.log("Will start tracking wallet for wallet: ", payload);  
    const client = new DynamoDBClient({ region: process.env.AWS_REGION as string});
    const docClient = DynamoDBDocumentClient.from(client);

    const getCommand = new GetCommand({
      TableName: "token-tracking",
      Key: {
        user_id: payload.user_id, 
      },
    });

    const responseGet = await docClient.send(getCommand);
    console.log('Get existing tracking data response', responseGet);

    let existsUserIdKey: boolean = responseGet.Item ? true: false;
    let existsToken = false;

    let existingItem: TokenTrackingData[];

    if(existsUserIdKey) {
      existingItem = JSON.parse(responseGet.Item.tokens); //array of tokens: TokenTrackingData[]
      //check if we are already tracking this wallet address for this very same network
      //not that evm based chains can have equal address on different chains
      existsToken = (existingItem.filter( (elem) => (elem.token === payload.data.token) && (elem.network === payload.data.network) ) ).length > 0;
    }

    if(existsToken) {
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            exists: existsToken, //indicates it exists
            token: payload.data.token, //the same data that was sent in the request
            network: payload.data.network
          })
      };
    } else {

      let command: any; 
      console.log("Its an update");

      let newItem: TokenTrackingData = { token: payload.data.token, network: payload.data.network};

      //its an update instead
      if(existsUserIdKey) {

        let tokensData: TokenTrackingData[] = existingItem;
        
        tokensData.push(newItem);
        
        command = new UpdateCommand({
          TableName: "token-tracking",
          Key: {
            user_id: payload.user_id
          },
          UpdateExpression: "set tokens = :tokens",
          ExpressionAttributeValues: {
            ":tokens": JSON.stringify(tokensData) ,
          },
          ReturnValues: "ALL_NEW" 
          });

      }
      else {
        //its a new item
        //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_BatchWriteItem_section.html
        command = new PutCommand({
          TableName: "token-tracking",
          Item: {
            user_id: payload.user_id,
            tokens: JSON.stringify([newItem])  
          },
        });

      }

      const response = await docClient.send(command);
        console.log('response:', response);

        return {
          statusCode: 200,
          body: JSON.stringify({added: true, data: payload}),
        };
    }

    

    //TODO THIS IS FINE!!!!
    // console.log("Getting history for token: ", token);
    // let tokenOperations = await getTokenHistory(token);
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify(tokenOperations),
    // };

  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

async function getTokenHistory(addressToken: string): Promise<any> {
  const apiKey: string = process.env.ETHPLORER_API_KEY as string;
  let response = await axios.get(`https://api.ethplorer.io/getTokenHistory/${addressToken}?apiKey=${apiKey}&limit=${LIMIT_TRANSACTIONS}`);
  console.log(response);
  if(response.data && response.data.operations) {
    return response.data.operations;
  }
  return [];
}

// async function startEventListener(): Promise<any> {

//   try {
//     const response: any = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD', {
//       headers: {
//         'X-CMC_PRO_API_KEY': process.env.COINMARKET_API_KEY,
//       },
//     });

//     console.log("coinmarketcap: reponse",response);

//     if(response) {
//       return response.data;
//     }
//   }catch(ex) {
//     console.log("coinmarketcap: reponse",[]);
//     return [];
//   }
// }



// async function startEventListener() {
//   // Connect to the provider
//   const provider = new ethers.JsonRpcProvider('mainnet', '<INFURA_API_KEY>');

//   // Connect to the contract
//   const contract = new ethers.Contract(tokenAddress, abi, provider);

//   // Create a filter to listen for Transfer events
//   const filter = contract.filters.Transfer(walletAddress, null);

//   // Start listening for Transfer events
//   contract.on(filter, (from, to, value) => {
//     console.log('Transfer event detected:');
//     console.log('From:', from);
//     console.log('To:', to);
//     console.log('Value:', value.toString());
//   });
// }

// startEventListener().catch((error) => console.error(error));

export const main = middyfy(walletTracker);
