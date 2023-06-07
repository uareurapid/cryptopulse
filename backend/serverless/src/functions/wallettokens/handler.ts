
import { middyfy } from '@libs/lambda';
// Setup: npm install alchemy-sdk
import { Alchemy, Network, TokenBalancesResponseErc20 } from "alchemy-sdk";
import { AlchemyTokenBalance } from 'src/models/AlchemyTokenBalance';

/*import schema from './schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  return formatJSONResponse({
    //${event.body.name}
    message: `Hello Paulo, welcome to the exciting Serverless world!`,
    event,
  });
};

export const main = middyfy(hello);*/

const ALCHEMY_API_KEY: string = process.env.ALCHEMY_API_KEY as string; 
//const baseURL: string = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;


const walletTokens = async (event) => {

  // Wallet address
  const address: string = event.body.address;

  try {
    console.log("Getting wallet ERC20 tokens for wallet: ", address);
    let tokens = await fetchWalletTokens(address);//fetchCryptoRankings();
    return {
      statusCode: 200,
      body: JSON.stringify(tokens),
    };
  }catch(ex) {

    console.error("got error", ex);
    return {
      statusCode: 500,
      body: ex.message,
    }
  }
  
};

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
    const nonZeroBalances = balances.tokenBalances.filter((token) => {
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
      balance = balance / Math.pow(10, metadata.decimals);
      let balanceAsNumber: string = balance.toFixed(2);

      result.push( {
        token_name: metadata.name,
        token_address: token.contractAddress,
        token_balance: balance,
        token_symbol: metadata.symbol
      })
  
      // Print name, balance, and symbol of token
      console.log(`${i++}. ${metadata.name}: ${balanceAsNumber} ${metadata.symbol}`);
    }

    return result;
}



export const main = middyfy(walletTokens);







