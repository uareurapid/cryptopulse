//import CoinModel from '../../models/CoinModel';
import { handlerPath } from '@libs/handler-resolver';

//Start tracking a wallet (if not exists). It will track token transfers between this wallet and others
//we will identify the transfers going IN or OUT

export const trackWallet = {
  handler: `${handlerPath(__dirname)}/handler.trackWallet`,
  timeout:30,
  events: [
    {
      http: {
        method: 'post',
        path: 'trackwallet',
       
        // request: {
        //   schemas: {
        //     'application/json': schema,
        //   },
        // },
      },
    },
  ],
};

export const getTrackedWallets = {
  handler: `${handlerPath(__dirname)}/handler.getTrackedWallets`,
  timeout:30,
  events: [
    {
      http: {
        method: 'post',
        path: 'get_tracked_wallets',
       
        // request: {
        //   schemas: {
        //     'application/json': schema,
        //   },
        // },
      },
    },
  ],
};
