//import CoinModel from '../../models/CoinModel';
import { handlerPath } from '@libs/handler-resolver';


export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout:20,
  events: [
    {
      http: {
        method: 'get',
        path: 'toptokens'
      },
    },
  ],
};
