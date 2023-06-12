//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { ERC20TransferHistory } from 'src/models/ERC20TransferHistory';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;
import { DynamoDBClient, BatchExecuteStatementCommand } from "@aws-sdk/client-dynamodb";
//https://www.npmjs.com/package/@aws-sdk/client-dynamodb

const walletTransfers = async (event) => {

  try {

    const data: ERC20TransferHistory = event.body.data; //wallet to get logs for
 

    console.log("Getting event logs for wallet: ", data);  

    // // a client can be shared by different commands.
    // const client = new DynamoDBClient({ region: "eu-west1" });

    // const params = {
    //   /** input parameters */
    // };
    // const command = new BatchExecuteStatementCommand(params);

 
    return {
      statusCode: 200,
      body: JSON.stringify("OK"),
    };
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

export const main = middyfy(walletTransfers);
