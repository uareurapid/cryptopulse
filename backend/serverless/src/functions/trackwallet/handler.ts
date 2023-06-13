//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { ERC20TransferHistory, WalletTracking } from 'src/models/ERC20TransferHistory';


//const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
//const AWS_SECRET_ACCESS_KEY= process.env.AWS_SECRET_ACCESS_KEY as string;

import { DynamoDBClient, BatchExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";

//https://www.npmjs.com/package/@aws-sdk/client-dynamodb
//https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_GetItem_section.html


const trackWallet = async (event) => {

  try {

    console.log("got body:", event.body);
    /**
     * {
        user_id: 'paulo_cristo',
        wallet: '0x87b70ea25ff45033e9234c3ca1d78b6e94e15004'
        }
     */

    const data: WalletTracking = event.body; //wallet to get logs for
 

    console.log("Will start tracking wallet for wallet: ", data);  
    const client = new DynamoDBClient({ region: process.env.AWS_REGION as string});
    const docClient = DynamoDBDocumentClient.from(client);

    const getCommand = new GetCommand({
      TableName: "wallet-tracking",
      Key: {
        user_id: data.user_id, 
      },
    });

    const responseGet = await docClient.send(getCommand);
    console.log('Get existing tracking data response', responseGet);
    /**
         * Item: {
        user_id: 'paulo_cristo',
        wallet: '["0x87b70ea25ff45033e9234c3ca1d78b6e94e15004"]'
      }
     */
    //exists key
    let existsUserIdKey: boolean = responseGet.Item ? true: false;
    let existsWallet = false;

    let existingItem: string[];

    if(existsUserIdKey) {
      existingItem = JSON.parse(responseGet.Item.wallet);
      existsWallet = (existingItem.filter( (wallet) => wallet === data.wallet)).length > 0;
    }

    //["0x87b70ea25ff45033e9234c3ca1d78b6e94e15004","0x7b0edb271ce743d6304ba1e7c6e0e83a0b9e6a38","0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88"]

    if(existsWallet) {
      return {
        statusCode: 200,
        body: JSON.stringify({exists: existsWallet, item: responseGet.Item})
      };
    } else {

        let command: PutCommand | UpdateCommand; 
        console.log("Its an update");
        //its an update instead
        if(existsUserIdKey) {

          let walletData: string[] = existingItem;
          walletData.push(data.wallet);
          
          command = new UpdateCommand({
            TableName: "wallet-tracking",
            Key: {
              user_id: data.user_id
            },
            UpdateExpression: "set wallet = :wallet",
            ExpressionAttributeValues: {
              ":wallet": JSON.stringify(walletData) ,
            },
            ReturnValues: "ALL_NEW" 
            });

        }
        else {

          //its a new item
          //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_BatchWriteItem_section.html
          command = new PutCommand({
            TableName: "wallet-tracking",
            Item: {
              user_id: data.user_id,
              wallet: JSON.stringify([data.wallet])  
            },
          });

        }
        
        const response = await docClient.send(command);
        console.log('response:', response);

        return {
          statusCode: 200,
          body: JSON.stringify({added: true, data}),
        };
    }

    
   
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

export const main = middyfy(trackWallet);
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