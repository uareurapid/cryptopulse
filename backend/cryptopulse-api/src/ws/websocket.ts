import { WebSocketServer, WebSocket } from 'ws';
import { generateUniqueID } from '../utils/util.js';

const WS_HEARTBEAT_INTERVAL = process.env.WS_HEARTBEAT_INTERVAL ? Number(process.env.WS_HEARTBEAT_INTERVAL) : 1000 * 15; // 15 seconds
const WS_HEARTBEAT_VALUE = 1;
let socketsIDS: Record<string,WebSocket> = {}
let sockets: any[] = []

export const START_SESSION_MESSAGE = 'start_session'

export class CryptoPulseWebsocketServer {

    private static instance: CryptoPulseWebsocketServer
    private server: WebSocketServer
   

    private constructor () {
        const websocketsPort = process.env.WEBSOCKETS_PORT ? Number(process.env.WEBSOCKETS_PORT) : 3030
        this.server = new WebSocketServer({ port: websocketsPort});
    }
    public static getInstance() {
        if(!CryptoPulseWebsocketServer.instance) {
          this.instance = new CryptoPulseWebsocketServer()
        }
        return this.instance
    }

    public setupWebsocketsServer() {
        console.log('Starting websockets...')
        // make sure it only tries to do it once
        
           
        this.server.on('connection', function connection(clientSocket) {
    
            const id = generateUniqueID()
            console.log('socket connection: ', connection)
            socketsIDS[id] = clientSocket
            sockets.push(clientSocket)
            console.log('sockets now: ', sockets)
            clientSocket.on('error', console.error);
                    
                clientSocket.on('message', function message(data) {
                    console.log('received: %s', data);
                    if(data.toString() === START_SESSION_MESSAGE) {

                        
                        clientSocket.send(`Client ID: ${id}`);
                    }
                });
    
                clientSocket.on('close', function() {
                    console.log('sockets before close: ', sockets)
                    sockets = sockets.filter(s => s !== clientSocket);
                    console.log('sockets after close: ', sockets)
                  });  
        });

        this.keepAlive()
    }
    // https://github.com/covalence-io/ws-template/blob/main/sockets/index.ts
    public sendWebsocketsMessageToClient(data: string) {

    console.log('sendWebsocketsMessageToClient ? wss? ')
    
    console.log('have clients? ', sockets.length > 0 ? sockets.length: ' no clients')
    sockets.forEach((client) => {
        // console.log('checking client, ', client)
        if (client.readyState === WebSocket.OPEN) {
            console.log('WILL SEND DATA')
            client.send(data);
        } else console.log('WILL IGNORE DATA')
    });
    // if(socketConnection) {
    //     console.log('SEND 2MESSAGE')
    //     socketConnection.send('SEGUNDA MENSAGEM')
    // } else {
    //     console.log('NO CONNECTION.......')
    // }
    
    }

    private ping(ws: WebSocket) {
        console.log('will ping client: ')
        ws.send(WS_HEARTBEAT_VALUE, { binary: true });
    }

    private keepAlive() {
        console.log('inside keep alive')
        const interval = setInterval(() => {
            console.log('firing interval');
            this.server.clients.forEach((client) => {
                if (client.readyState !== WebSocket.OPEN) {
                    console.log('TERMINATED SOCKET')
                    client.terminate();
                    return;
                }
    
                this.ping(client);
            });
        }, WS_HEARTBEAT_INTERVAL);
    
        this.server.on('close', () => {
            clearInterval(interval);
        });
    }
}


// console.log('STARTING SOCKETS...')
// const websocketsPort = process.env.WEBSOCKETS_PORT ? Number(process.env.WEBSOCKETS_PORT) : 3030
// export const WEBSOCKETS_SERVER: WebSocketServer = new WebSocketServer({ port: websocketsPort});
// export let OPEN_SOCKETS: any[] = []
// // let socketConnection: WebSocket



