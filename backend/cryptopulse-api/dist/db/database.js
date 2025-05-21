var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MongoClient } from 'mongodb';
export function getDBConnectionURL() {
    const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@127.0.0.1:27017/${process.env.MONGO_DB}`;
    console.log('connection uri: ', uri);
    return uri;
}
export const TABLES = {
    USERS: "users",
    SUPPORTED_CHAINS: "supported-chains",
    WALLET_TRACKING: "wallet-tracking",
    TOKEN_TRACKING: "token-tracking",
    WALLET_TRANSFERS: "wallet-transfers",
    TOKEN_TRANSFERS: "token-transfers"
};
export const DATABASE_NAME = process.env.MONGO_DB;
export class CryptoPulseDatabase {
    constructor() {
        // const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb:27017/`;
        this.client = new MongoClient(getDBConnectionURL());
        this.database = this.client.db(DATABASE_NAME);
    }
    static getInstance() {
        if (!CryptoPulseDatabase.instance) {
            this.instance = new CryptoPulseDatabase();
        }
        return this.instance;
    }
    getClient() {
        return this.client;
    }
    getDatabase() {
        return this.database;
    }
    getURL() {
        return getDBConnectionURL();
    }
    getCollection(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Object.values(TABLES).includes(name)) {
                throw new Error('Unsupported collection name: ' + name);
            }
            return yield (this.getDatabase()).collection(name); // had an extra await
        });
    }
    getAllCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (this.getDatabase()).collections(); // same
        });
    }
}
// async function run() {
//   try {
//     const database = client.db('sample_mflix');
//     const movies = database.collection('movies');
//     // Query for a movie that has the title 'Back to the Future'
//     const query = { title: 'Back to the Future' };
//     const movie = await movies.findOne(query);
//     console.log(movie);
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);
//# sourceMappingURL=database.js.map