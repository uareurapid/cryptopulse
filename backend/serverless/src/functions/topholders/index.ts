//import CoinModel from '../../models/CoinModel';
import { handlerPath } from '@libs/handler-resolver';


const schema = {
  type: "object",
  properties: {
    address: { type: 'string' }
  },
  required: ['address']
} ;


export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'topholders',
         request: {
           schemas: {
             'application/json': schema,
           },
         },
      },
    },
  ],
};
