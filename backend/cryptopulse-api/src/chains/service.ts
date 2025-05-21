import { CryptoPulseDatabase, TABLES } from "../db/database.js"
import { ChainModel } from "../models/DBModels.js"
import { SUPPORTED_NETWORKS } from "../utils/Constants.js"


function getDefaultChains(): ChainModel[] {
    const defaultChains: ChainModel[] = []
    const values = Object.values(SUPPORTED_NETWORKS)
    console.log('VALUES: ', values)
    for(const value of values) {
        defaultChains.push(value as ChainModel)
    }
    return defaultChains
}
export async function getSupportedChains(): Promise <ChainModel[]> {

    const existingChains: ChainModel[] = []
    const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.SUPPORTED_CHAINS)
    if(await collection.estimatedDocumentCount() === 0) {
        console.log('default chains, db is empty: ', getDefaultChains())
        return getDefaultChains()
    }
    const allChains = await collection.find()
    while (await allChains.hasNext()) {
        const chain: ChainModel = await allChains.next() as ChainModel
        // console.log('got docs: ', trackedWallets)
        existingChains.push(chain)
    }
    console.log('will return existing: ', existingChains)
    return existingChains
}

export async function addSupportedChain(chainId: number, chainName: string): Promise <boolean> {

    try {
        const collection = await CryptoPulseDatabase.getInstance().getCollection(TABLES.SUPPORTED_CHAINS)
    
        const filter = {chain_id: chainId, chain_name: chainName}
        const count = await collection.countDocuments(filter)
        if(count === 0) {
    
            // all good, can insert
            const result = await collection.insertOne(filter)
            console.log(`A ChainModel document was inserted with the _id: ${result.insertedId}`);
            return true
        }
        console.log(`chain with id: ${chainId} and name: ${chainName} already exists on database!`)
        
    }catch(err) {
        console.log('Could not add new chain: ', err)
    }
    return false
    
}
