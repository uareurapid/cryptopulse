//import CoinModel from '../../models/CoinModel';
import { handlerPath } from '@libs/handler-resolver';


export const trackToken = {
  handler: `${handlerPath(__dirname)}/handler.trackToken`,
  timeout:30,
  events: [
    {
      http: {
        method: 'post',
        path: 'tracktoken',
       
        // request: {
        //   schemas: {
        //     'application/json': schema,
        //   },
        // },
      },
    },
  ],
};

export const getTrackedTokens = {
  handler: `${handlerPath(__dirname)}/handler.getTrackedTokens`,
  timeout:30,
  events: [
    {
      http: {
        method: 'post',
        path: 'get_tracked_tokens',
       
        // request: {
        //   schemas: {
        //     'application/json': schema,
        //   },
        // },
      },
    },
  ],
};
