//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { middyfy } from '@libs/lambda';
import axios from 'axios';

//might depend on subscription/account type
const LIMIT_TRANSACTIONS = 50;


const getTrackedTokens = async (event) => {

  try {

    const user_id: string = event.body.user_id; //user id, to know what he is tracking in terms of tokens

    console.log("Will get tracked tokens for user id: ", user_id);

    if(!user_id) {
      return {
        statusCode: 400,
        body: "Invalid or missing parameters"
      }
    }

    
 

    console.log("Will start getting info about tracked tokens for user id: ", user_id);  
    const client = new DynamoDBClient({ region: process.env.AWS_REGION as string});
    const docClient = DynamoDBDocumentClient.from(client);

    const getCommand = new GetCommand({
      TableName: "token-tracking",
      Key: {
        user_id: user_id, 
      },
    });

    const responseGet = await docClient.send(getCommand);
    console.log('Get existing tracking data response', responseGet);

    let existsUserIdKey: boolean = responseGet.Item ? true: false;

    //let existingItems: TokenTrackingData[];

    if(existsUserIdKey) {
      //existingItems = JSON.parse(responseGet.Item.tokens); //array of tokens: TokenTrackingData[]
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            data: {
              tokens: responseGet.Item.tokens
            }
          })
      };
    }
      
    return {
        statusCode: 200,
        body: {
          data: {}
        },
    };
    

    

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

export const main = middyfy(getTrackedTokens);

