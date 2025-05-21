var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CryptoPulseDatabase, TABLES } from "../db/database.js";
/**
 * Gte all the tracked wallets for a given user (the one logged in)
 * @param user_id the user
 * @returns wallets that user is tracking
 */
export function getTrackedWallets(user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will start getting info about tracked wallets for user id: ", user_id);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No wallet data yet for user: ', user_id);
                return { wallets: [] }; // TODO return empty array instead???
            }
            const allWallets = yield collection.find(filter);
            // console.log('all wallets: ', allWallets)
            let existingItems = [];
            while (yield allWallets.hasNext()) {
                const trackedWallets = yield allWallets.next();
                // console.log('got docs: ', trackedWallets)
                existingItems = trackedWallets.wallets;
            }
            // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
            return { wallets: existingItems };
        }
        catch (err) {
            console.error(err);
            return { wallets: [] };
        }
    });
}
export function getExistingWallet(user_id, walletAddress, network) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will start getting info about tracked wallets for user id: ", user_id);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No wallet data yet for user: ', user_id);
                return null;
            }
            const allWallets = yield collection.find(filter);
            // console.log('all wallets: ', allWallets)
            let existingItems = [];
            while (yield allWallets.hasNext()) {
                const trackedWallets = yield allWallets.next();
                // console.log('got docs: ', trackedWallets)
                existingItems = trackedWallets.wallets;
            }
            // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
            const filteredWallet = existingItems.filter((elem) => (elem.wallet === walletAddress) && (elem.network === network));
            return filteredWallet.length > 0 ? filteredWallet[0] : null;
        }
        catch (err) {
            console.error(err);
            return null;
        }
    });
}
export function updateExistingWalletBlock(user_id_1, walletAddress_1, network_1) {
    return __awaiter(this, arguments, void 0, function* (user_id, walletAddress, network, balance = 0, lastBlock) {
        try {
            console.log("Will updateExistingWalletBlock for wallet: " + walletAddress + ' and network: ' + network + ' and block: ' + lastBlock);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: user_id };
            if ((yield collection.countDocuments(filter)) === 0) {
                console.log('No wallet data yet for user: ', user_id);
                return false;
            }
            const allWallets = yield collection.find(filter);
            // console.log('all wallets: ', allWallets)
            let existingItems = [];
            let trackedWalletsDBData;
            while (yield allWallets.hasNext()) {
                trackedWalletsDBData = (yield allWallets.next());
                // console.log('got docs: ', trackedWalletsDBData)
                existingItems = trackedWalletsDBData.wallets;
            }
            if (!trackedWalletsDBData || existingItems.length === 0) {
                console.log('could not find any WalletTrackingDBModel info for ', user_id);
                return false;
            }
            // https://www.mongodb.com/docs/manual/tutorial/iterate-a-cursor/
            // maybe i can keep it in memory?
            let found = false;
            let index = -1;
            let elementToUpdate;
            for (let i = 0; i < existingItems.length; i++) {
                const elem = existingItems[i];
                if (elem.wallet === walletAddress && elem.network === network) {
                    elem.last_block = lastBlock;
                    elem.current_balance = balance;
                    found = true;
                    index = i;
                    elementToUpdate = elem;
                    break;
                }
            }
            if (elementToUpdate && index > -1) {
                existingItems[index] = elementToUpdate;
                const result = yield collection.updateOne({ _id: trackedWalletsDBData._id }, { $set: { wallets: existingItems } }, /* Set the upsert option to insert a document if no documents
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
export function updateOrCreateWalletTracking(userId, walletData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Specifying a Schema is optional, but it enables type hints on
        // finds and inserts
        // const haiku = database.collection<Haiku>("haiku");
        try {
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: userId };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                console.log('No data yet for user: ', userId);
                const data2Insert = {
                    user_id: userId,
                    wallets: [walletData]
                };
                const result = yield collection.insertOne(data2Insert);
                console.log(`A WalletTrackingData document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            else if (count === 1) {
                const userWallets = yield collection.find(filter);
                if (yield userWallets.hasNext()) {
                    const toUpdate = yield userWallets.next();
                    console.log('to: update: ', toUpdate);
                    toUpdate.wallets.push(walletData);
                    console.log('to upadte after: ', toUpdate);
                    const result = yield collection.updateOne({ _id: toUpdate._id }, { $set: { wallets: toUpdate.wallets } }, /* Set the upsert option to insert a document if no documents
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
            console.log('error tracking new wallet: ', err);
            return false;
        }
    });
}
export function updateWalletLabel(userId, wallet, network, label) {
    return __awaiter(this, void 0, void 0, function* () {
        // Specifying a Schema is optional, but it enables type hints on
        // finds and inserts
        // const haiku = database.collection<Haiku>("haiku");
        try {
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: userId };
            const count = yield collection.countDocuments(filter);
            if (count === 1) {
                const userWallets = yield collection.find(filter);
                if (yield userWallets.hasNext()) {
                    const allWalletsDB = yield userWallets.next();
                    let allWallets = allWalletsDB.wallets;
                    allWallets.flatMap((elem) => {
                        if (elem.wallet === wallet && elem.network === network) {
                            elem.label = label;
                        }
                    });
                    const result = yield collection.updateOne({ _id: allWalletsDB._id }, { $set: { wallets: allWallets } }, /* Set the upsert option to insert a document if no documents
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
            console.log('error tracking new wallet: ', err);
            return false;
        }
    });
}
export function updateOrCreateWalletTracking2(userId, walletData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Specifying a Schema is optional, but it enables type hints on
        // finds and inserts
        // const haiku = database.collection<Haiku>("haiku");
        try {
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRACKING);
            const filter = { user_id: userId };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                console.log('No data yet for user: ', userId);
                const data2Insert = {
                    user_id: userId,
                    wallets: [walletData]
                };
                const result = yield collection.insertOne(data2Insert);
                console.log(`A WalletTrackingData document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            else if (count === 1) {
                const userWallets = yield collection.find(filter);
                if (yield userWallets.hasNext()) {
                    const toUpdate = yield userWallets.next();
                    console.log('to: update: ', toUpdate);
                    toUpdate.wallets.push(walletData);
                    console.log('to upadte after: ', toUpdate);
                    const result = yield collection.updateOne({ _id: toUpdate._id }, { $set: { wallets: toUpdate.wallets } }, /* Set the upsert option to insert a document if no documents
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
            console.log('error tracking new wallet: ', err);
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
export function updateWalletTrackingDataWithTransferData(userId, wallet, network, transfersData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Will updateTrackingDataWithTransferData id: " + userId + ' for wallet: ' + wallet);
            console.log('with data: ', transfersData);
            // const client = new DynamoDBClient({ region: process.env.AWS_REGION as string, endpoint: DB_URL});
            // const docClient = DynamoDBDocumentClient.from(client);
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.WALLET_TRANSFERS);
            const filter = { user_id: userId, wallet: wallet, chain: network };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                // nothing yet
                console.log('No data yet for user: ', userId);
                const data2Insert = {
                    user_id: userId,
                    wallet: wallet,
                    chain: network,
                    records: transfersData
                };
                const result = yield collection.insertOne(data2Insert);
                console.log(`A WalletTransfersDBModel document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            else {
                // only do updates
                const userHistory = yield collection.find(filter);
                let toUpdate = null;
                if (yield userHistory.hasNext()) {
                    toUpdate = (yield userHistory.next());
                    // now filter for this specific wallet and chain combination
                    if (toUpdate.wallet !== wallet || toUpdate.chain !== network) {
                        toUpdate = null;
                    }
                }
                // found the data relative to the wallet/network
                if (toUpdate !== null) {
                    // this is the corresponding wallet & network position on the array
                    const recordData = toUpdate.records;
                    console.log(`GOOD TO ADD DATA for wallet ${wallet} and network ${network}, and transfer data: ${transfersData}`);
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
                // else {
                //     console.log('either its a new wallet on the same network, or the same wallet on another network, either way its an addition')
                //     console.log(`No data yet for wallet ${wallet} and network: ${network} adding a new entry on history`) 
                //       const data2Insert: WalletTransfersDBModel = {
                //         user_id: userId,
                //         wallet: wallet,
                //         chain: network,
                //         records: transfersData
                //       }
                //       historicData.push(data2Insert)
                //       const resultUpdate = await collection.updateOne( {_id: toUpdate._id}, {$set: {history: historicData}}, /* Set the upsert option to insert a document if no documents
                //         match the filter */
                //         { upsert: true })
                //         // Print the number of matching and modified documents
                //       console.log(
                //         `${resultUpdate.matchedCount} document(s) matched the filter, updated ${resultUpdate.modifiedCount} document(s)`
                //       );
                //       return resultUpdate.modifiedCount > 0
                //   }
            }
            console.log('something is wrong, added nothing? for wallet: ', wallet);
            return false;
        }
        catch (err) {
            console.error('Got error on updateTrackingDataWithTransferData', err);
            return false;
        }
    });
}
//# sourceMappingURL=service.js.map