//import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
//import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
// CoinGecko API endpoint to get cryptocurrency market data
import axios from 'axios';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY as string;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

const walletLogs = async (event) => {

  try {

    const wallet: string = event.body.wallet; //wallet to get logs for
    let block: string = event.body.block; //start block
    if(!block) {
      block = "0x0";
    }

  console.log("Getting event logs for wallet: ", wallet);  

  let payload: string = JSON.stringify({
      "jsonrpc": "2.0",
      "id": 0,
      "method": "alchemy_getAssetTransfers",
      "params": [
        {
          "fromBlock": block,
          "fromAddress": wallet,
        }
      ]
    });

    let requestOptions = {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      data: payload,
    };

  
  const axiosURL = `${baseURL}`;

  let response = await axios(axiosURL, requestOptions)
  console.log("Logs result: ");
  console.log(JSON.stringify(response.data, null, 2));
 
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    };
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

export const main = middyfy(walletLogs);
