//import CoinModel from '../../models/CoinModel';
import { handlerPath } from '@libs/handler-resolver';


export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'toptokens',
        timeout:20
      },
    },
  ],
};