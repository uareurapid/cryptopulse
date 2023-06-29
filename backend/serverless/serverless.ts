import type { AWS } from '@serverless/typescript';

import walletTokens from '@functions/wallettokens'; //get all ERC20 from a given wallet -> alchemy 
import top10Coins from '@functions/topcoins'; // get the top 10 cryptos by market cap -> coinmarket cap
import top10Holders from '@functions/topholders'; //get the top 10 holders of a given ERC20 token -> ethplorer
import top50Tokens from '@functions/toptokens'; //get the top 50 ERC20 by activity in the last 30 days -> ethplorer
import { trackWallet, getTrackedWallets } from '@functions/trackwallet';
import { trackToken, getTrackedTokens } from '@functions/tracktoken';
//import getTrackedTokens from '@functions/gettrackedtokens';

const serverlessConfiguration: AWS = {
  service: 'serverless',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-dotenv-plugin','serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  // import the function via paths
  functions: { 
    walletTokens, //get wallet tokens
    top10Coins,  //get top 10 coins by market cap
    top10Holders, //get top 10 wallets/holders of a given token
    top50Tokens, //top 50 tokens by volume/activity in the last 30 days
    trackWallet, //start tracking a wallet
    getTrackedWallets, // get all tracked wallets
    trackToken, //start tracking a token
    getTrackedTokens // get list of tracked ones
    //getTrackedTokens//get list of tracked tokens
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
