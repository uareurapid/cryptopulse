var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { processReindexToken } from "../crypto/blockchainTracking.js";
import { CryptoPulseDatabase, TABLES } from "../db/database.js";
export function getTrackedTokens(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will start getting info about tracked tokens for user id: ", user_id);
            console.log('region: ', process.env.AWS_REGION);
            console.log('access key: ', process.env.AWS_ACCESS_KEY_ID);
            console.log('AWS_SECRET_ACCESS_KEY: ', process.env.AWS_SECRET_ACCESS_KEY);
            console.log("Will start getting info about tracked tokens for user id: ", user_id);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No token data yet for user: ', user_id);
                return { tokens: [] }; // TODO return empty array instead???
            }
            const allTokens = yield collection.find(filter);
            console.log('all tokens: ', allTokens);
            let existingItems = [];
            while (yield allTokens.hasNext()) {
                const trackedTokens = yield allTokens.next();
                console.log('got docs: ', trackedTokens);
                existingItems = trackedTokens.tokens;
            }
            return { tokens: existingItems };
        }
        catch (error) {
            console.error(error);
            return { tokens: [] };
        }
    });
}
export function updateOrCreateTokenTracking(userId, tokenData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Specifying a Schema is optional, but it enables type hints on
        // finds and inserts
        // const haiku = database.collection<Haiku>("haiku");
        try {
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING);
            const filter = { user_id: userId };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                console.log('No data yet for user: ', userId);
                const data2Insert = {
                    user_id: userId,
                    tokens: [tokenData]
                };
                const result = yield collection.insertOne(data2Insert);
                console.log(`A TokenTrackingData document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            else if (count === 1) {
                const userTokens = yield collection.find(filter);
                if (yield userTokens.hasNext()) {
                    const toUpdate = yield userTokens.next();
                    console.log('to: update: ', toUpdate);
                    toUpdate.tokens.push(tokenData);
                    console.log('to upadte after: ', toUpdate);
                    const result = yield collection.updateOne({ _id: toUpdate._id }, { $set: { tokens: toUpdate.tokens } }, /* Set the upsert option to insert a document if no documents
                      match the filter */ { upsert: true });
                    // Print the number of matching and modified documents
                    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
                    return true;
                }
            }
            // something is wrong
            return false;
        }
        catch (err) {
            console.log('error tracking new token: ', err);
            return false;
        }
    });
}
export function getExistingToken(user_id, tokenAddress, network) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will start getting info about tracked tokens for user id: ", user_id);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No token data yet for user: ', user_id);
                return null;
            }
            const allTokens = yield collection.find(filter);
            // console.log('all tokens: ', allTokens)
            let existingItems = [];
            while (yield allTokens.hasNext()) {
                const trackedTokens = yield allTokens.next();
                console.log('got docs: ', trackedTokens);
                existingItems = trackedTokens.tokens;
            }
            // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
            const filteredToken = existingItems.filter((elem) => (elem.token === tokenAddress) && (elem.network === network));
            return filteredToken.length > 0 ? filteredToken[0] : null;
        }
        catch (err) {
            console.error(err);
            return null;
        }
    });
}
export function updateExistingTokenBlock(user_id_1, tokenAddress_1, network_1) {
    return __awaiter(this, arguments, void 0, function* (user_id, tokenAddress, network, balance = 0, lastBlock) {
        try {
            console.log("Will updateExistingTokenBlock for token: " + tokenAddress + ' and network: ' + network + ' and block: ' + lastBlock);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No token data yet for user: ', user_id);
                return false;
            }
            const allTokens = yield collection.find(filter);
            // console.log('all wallets: ', allWallets)
            let existingItems = [];
            let trackedTokensDBData;
            while (yield allTokens.hasNext()) {
                trackedTokensDBData = (yield allTokens.next());
                // console.log('got docs: ', trackedWalletsDBData)
                existingItems = trackedTokensDBData.tokens;
            }
            if (!trackedTokensDBData || existingItems.length === 0) {
                console.log('could not find any TokenTrackingDBModel info for ', user_id);
                return false;
            }
            // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
            // maybe i can keep it in memory?
            let found = false;
            let index = -1;
            let elementToUpdate;
            for (let i = 0; i < existingItems.length; i++) {
                const elem = existingItems[i];
                if (elem.token === tokenAddress && elem.network === network) {
                    elem.last_block = lastBlock;
                    found = true;
                    index = i;
                    elementToUpdate = elem;
                    break;
                }
            }
            if (elementToUpdate && index > -1) {
                existingItems[index] = elementToUpdate;
                const result = yield collection.updateOne({ _id: trackedTokensDBData._id }, { $set: { tokens: existingItems } }, /* Set the upsert option to insert a document if no documents
                  match the filter */ { upsert: true });
                // Print the number of matching and modified documents
                console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
                return result.modifiedCount === 1;
            }
            return found;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    });
}
/**
 * Records tranfer data for
 * @param user_id
 * @param network
 * @param transfersData
 * @returns
 */
export function updateTokenTrackingDataWithTransferData(userId, token, network, transfersData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will updateTokenTrackingDataWithTransferData id: " + userId + ' for token: ' + token);
            console.log('with data: ', transfersData);
            // const client = new DynamoDBClient({ region: process.env.AWS_REGION as string, endpoint: DB_URL});
            // const docClient = DynamoDBDocumentClient.from(client);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.TOKEN_TRANSFERS);
            const filter = { user_id: userId, token: token, chain: network };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                // nothing yet
                console.log('No data yet for user: ', userId);
                const data2Insert = {
                    user_id: userId,
                    token: token,
                    chain: network,
                    records: transfersData
                };
                const result = yield collection.insertOne(data2Insert);
                console.log(`A TokenTransfersDBModel document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            else {
                // only do updates
                const userHistory = yield collection.find(filter);
                let toUpdate = null;
                if (yield userHistory.hasNext()) {
                    toUpdate = (yield userHistory.next());
                    // now filter for this specific token and chain combination
                    if (toUpdate.token !== token || toUpdate.chain !== network) {
                        toUpdate = null;
                    }
                }
                // found the data relative to the token/network
                if (toUpdate !== null) {
                    // this is the corresponding token & network position on the array
                    const recordData = toUpdate.records;
                    console.log(`GOOD TO ADD DATA for token ${token} and network ${network}, and transfer data: ${transfersData}`);
                    // get the transfer hashes, so we don't put the same tarsnfer data again
                    const existingHashes = recordData.flatMap((record) => {
                        return record.hash;
                    });
                    let shouldUpdate = false;
                    // console.log('existsting transaction hashes are: ', existingHashes)
                    for (const newData of transfersData) {
                        // if the transaction hash is not there yet, add it now
                        if (!existingHashes.includes(newData.hash)) {
                            shouldUpdate = true;
                            // console.log('will add the data to an existing record', newData)
                            recordData.push(newData);
                        }
                    }
                    // any updates?
                    if (shouldUpdate) {
                        // console.log('existingTransferItems before: ',historicData[indexOfItem].records)
                        toUpdate.records = recordData;
                        const result = yield collection.updateOne({ _id: toUpdate._id }, { $set: { records: recordData } }, /* Set the upsert option to insert a document if no documents
                              match the filter */ { upsert: true });
                        // Print the number of matching and modified documents
                        console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
                        // console.log('existingTransferItems after: ',historicData[indexOfItem].records)
                        return result.modifiedCount > 0;
                    }
                }
            }
            console.log('something is wrong, added nothing? for token: ', token);
            return false;
        }
        catch (err) {
            console.error('Got error on updateTrackingDataWithTransferData', err);
            return false;
        }
    });
}
export function reindexToken(userId, existingToken) {
    return processReindexToken(userId, existingToken);
}
//# sourceMappingURL=service.js.map