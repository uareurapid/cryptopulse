import { handlerPath } from '@libs/handler-resolver';

const requestSchema = {
  type: "object",
  properties: {
    name: { type: 'address' }
  },
  required: ['address']
};

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  timeout:20,
  events: [
    {
      http: {
        method: 'post',
        path: 'wallettokens',
        request: {
          schemas: {
            'application/json': requestSchema,
          },
        },
      },
    },
  ],
};
