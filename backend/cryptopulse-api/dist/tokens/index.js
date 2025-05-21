var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import axios from 'axios';
import { DB_URL, START_TRACKING_EVENTS } from '../utils/Constants.js';
import { getDefaultChunkSize, getStartBlockFromNetworkHeight, isSupportedNetwork } from '../utils/util.js';
import EventEmitter from 'node:events';
import { getExistingToken, getTrackedTokens, reindexToken, updateOrCreateTokenTracking } from './service.js';
import { startListeningSingleToken } from '../crypto/blockchainTracking.js';
//might depend on subscription/account type
const LIMIT_TRANSACTIONS = 50;
export const tokensRoutes = express.Router();
export const TOKENS_API_BASE_PATH = '/api/tokens';
export const TOKENS_EVENT_EMITTER = new EventEmitter();
function listTables() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('will list tables:');
            const client = new DynamoDBClient({ endpoint: DB_URL });
            const command = new ListTablesCommand({});
            const response = yield client.send(command);
            if (response) {
                console.log((_a = response === null || response === void 0 ? void 0 : response.TableNames) === null || _a === void 0 ? void 0 : _a.join("\n"));
                return response;
            }
            return ('invalid stuff');
        }
        catch (err) {
            console.log('got error: ', err);
            return ('invalid stuff');
        }
    });
}
tokensRoutes.post(`${TOKENS_API_BASE_PATH}/track_token`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('request body was: ', req.body);
        console.log('request body data was: ', req.body.data);
        const payload = req.body; //wallet to get logs for
        console.log('got payload: ', payload);
        const token = payload.data.token;
        console.log("got token: ", token);
        if (!token) {
            res.status(400).send("Invalid or missing parameters");
            return;
        }
        const userId = payload.user_id;
        if (!userId) {
            res.status(400).send(`Missing "user_id"`);
            return;
        }
        const supported = yield isSupportedNetwork(payload.data.network);
        if (!supported) {
            res.status(500).send(`Chain ${payload.data.network} is either not valid or not supported`);
            return;
            // get block number
            // add it to the DB schema
            // start tracking this new wallet
            // got to check the running threads, and if there is one for this network, add the wallet
        }
        console.log("Will start tracking token for wallet: ", payload);
        const existingData = yield getTrackedTokens(payload.user_id); // {wallets: WalletTrackingData[]}
        console.log('Get existing tracking data response', existingData);
        let existingItems = existingData.tokens;
        let existsUserIdKey = existingItems.length > 0 ? true : false;
        let existsToken = false;
        console.log('existsUserIdKey? : ', existsUserIdKey);
        if (existsUserIdKey) {
            // existingItem = JSON.parse(responseGet?.Item?.tokens); //array of tokens: TokenTrackingData[]
            //check if we are already tracking this wallet address for this very same network
            //not that evm based chains can have equal address on different chains
            existsToken = (existingItems.filter((elem) => (elem.token === payload.data.token) && (elem.network === payload.data.network))).length > 0;
        }
        if (existsToken) {
            console.log('token exists already');
            const body = {
                exists: existsToken, //indicates it exists
                token: payload.data.token, //the same data that was sent in the request
                network: payload.data.network
            };
            res.json(body);
            return;
        }
        else {
            console.log("Its an update");
            let newItem = { token: payload.data.token, network: payload.data.network };
            console.log('set new item to: ', newItem);
            const startBlock = yield getStartBlockFromNetworkHeight(supported);
            newItem.start_block = startBlock;
            newItem.last_block = -1; // means no last block 
            newItem.chunk_size = getDefaultChunkSize();
            const response = yield updateOrCreateTokenTracking(payload.user_id, payload.data);
            if (response) {
                TOKENS_EVENT_EMITTER.emit(START_TRACKING_EVENTS.START_TRACKING_TOKEN, {
                    data: newItem,
                    user_id: userId
                });
                startListeningSingleToken(newItem, userId, supported);
            }
            res.json({ added: response === true, data: payload });
        }
        //TODO THIS IS FINE!!!!
        // console.log("Getting history for token: ", token);
        // let tokenOperations = await getTokenHistory(token);
        // return {
        //   statusCode: 200,
        //   body: JSON.stringify(tokenOperations),
        // };
    }
    catch (ex) {
        console.error("got error", ex);
        res.status(500).send(ex.message);
    }
}));
tokensRoutes.get(`${TOKENS_API_BASE_PATH}/tracked_tokens`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id } = req.query; //user id, to know what he is tracking in terms of tokens
        console.log("Will get tracked tokens for user id: ", user_id);
        if (!user_id) {
            res.status(400).send('Missing or invalid required parameter: "user_id"');
            return;
        }
        const data = yield getTrackedTokens(user_id);
        console.log('will send tokens data: ', data);
        res.json(data);
        //TODO THIS IS FINE!!!!
        // console.log("Getting history for token: ", token);
        // let tokenOperations = await getTokenHistory(token);
        // return {
        //   statusCode: 200,
        //   body: JSON.stringify(tokenOperations),
        // };
    }
    catch (ex) {
        console.error("got error", ex);
        res.status(500).send(ex.message);
    }
}));
tokensRoutes.get(`${TOKENS_API_BASE_PATH}/top_50_tokens`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let top50 = yield getTop50Tokens();
        // console.log("Server call top 50 tokens returned:", top50);
        res.json(top50);
    }
    catch (ex) {
        console.error("got error", ex);
        res.status(500).send(ex.message);
    }
}));
function getTokenHistory(addressToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.ETHPLORER_API_KEY;
        let response = yield axios.get(`https://api.ethplorer.io/getTokenHistory/${addressToken}?apiKey=${apiKey}&limit=${LIMIT_TRANSACTIONS}`);
        console.log(response);
        if (response.data && response.data.operations) {
            return response.data.operations;
        }
        return [];
    });
}
function getTop50Tokens() {
    return __awaiter(this, void 0, void 0, function* () {
        let apiKey = process.env.ETHPLORER_API_KEY;
        console.log("API KEY: " + apiKey);
        let response = yield axios.get(`https://api.ethplorer.io/getTopTokens?apiKey=${apiKey}`);
        // console.log(response);
        if (response.data && response.data.tokens) {
            return response.data.tokens;
        }
        return [];
    });
}
tokensRoutes.post(`${TOKENS_API_BASE_PATH}/reindex_token`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('request body was: ', req.body);
        console.log('request body data was: ', req.body.data);
        const payload = req.body; //wallet to get logs for
        if (!payload.user_id || !payload.data.token || !payload.data.network) {
            res.status(400).send('Bad request. Invalid or missing parameters!');
        }
        const existing = yield getExistingToken(payload.user_id, payload.data.token, payload.data.network);
        if (existing !== null) {
            const result = reindexToken(payload.user_id, existing);
            res.status(result ? 200 : 500).send(result ? 'OK' : 'Unable to find worker thread for token');
        }
        else {
            res.status(404).send('Token not found!');
        }
    }
    catch (err) {
        console.log('got error on restart: ', err);
        res.status(500).send(err.message);
    }
}));
//# sourceMappingURL=index.js.map