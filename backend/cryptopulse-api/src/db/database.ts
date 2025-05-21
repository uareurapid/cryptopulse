import { Collection, Db, MongoClient } from 'mongodb'
import { TokenTrackingDBModel, WalletTrackingDBModel } from '../models/DBModels.js'


export function getDBConnectionURL(): string {
  const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@127.0.0.1:27017/${process.env.MONGO_DB}`
  console.log('connection uri: ', uri)
  return uri
}

export const TABLES = {
  USERS: "users",
  SUPPORTED_CHAINS: "supported-chains",
  WALLET_TRACKING: "wallet-tracking",
  TOKEN_TRACKING: "token-tracking",
  WALLET_TRANSFERS: "wallet-transfers",
  TOKEN_TRANSFERS: "token-transfers"
} 

export const DATABASE_NAME = process.env.MONGO_DB
export class CryptoPulseDatabase {

  private static instance: CryptoPulseDatabase
  private client: MongoClient
  private database: Db
  private constructor () {
    // const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb:27017/`;
    this.client = new MongoClient(getDBConnectionURL());
    this.database = this.client.db(DATABASE_NAME)
  }

  public static getInstance() {
    if(!CryptoPulseDatabase.instance) {
      this.instance = new CryptoPulseDatabase()
    }
    return this.instance
  }

  public getClient(): MongoClient {
     return this.client
  }



  public getDatabase(): Db { // was async
    return this.database
  }

  public getURL() {
    return getDBConnectionURL()
  }

  public async getCollection(name: string): Promise <Collection<any>> {
    if(!Object.values(TABLES).includes(name)) {
      throw new Error('Unsupported collection name: ' + name)
    }
    return await (this.getDatabase()).collection(name) // had an extra await
  }

  public async getAllCollections(): Promise<Collection[]> {
    return await (this.getDatabase()).collections() // same
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