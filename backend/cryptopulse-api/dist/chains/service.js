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
import { SUPPORTED_NETWORKS } from "../utils/Constants.js";
function getDefaultChains() {
    const defaultChains = [];
    const values = Object.values(SUPPORTED_NETWORKS);
    console.log('VALUES: ', values);
    for (const value of values) {
        defaultChains.push(value);
    }
    return defaultChains;
}
export function getSupportedChains() {
    return __awaiter(this, void 0, void 0, function* () {
        const existingChains = [];
        const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.SUPPORTED_CHAINS);
        if ((yield collection.estimatedDocumentCount()) === 0) {
            console.log('default chains, db is empty: ', getDefaultChains());
            return getDefaultChains();
        }
        const allChains = yield collection.find();
        while (yield allChains.hasNext()) {
            const chain = yield allChains.next();
            // console.log('got docs: ', trackedWallets)
            existingChains.push(chain);
        }
        console.log('will return existing: ', existingChains);
        return existingChains;
    });
}
export function addSupportedChain(chainId, chainName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const collection = yield CryptoPulseDatabase.getInstance().getCollection(TABLES.SUPPORTED_CHAINS);
            const filter = { chain_id: chainId, chain_name: chainName };
            const count = yield collection.countDocuments(filter);
            if (count === 0) {
                // all good, can insert
                const result = yield collection.insertOne(filter);
                console.log(`A ChainModel document was inserted with the _id: ${result.insertedId}`);
                return true;
            }
            console.log(`chain with id: ${chainId} and name: ${chainName} already exists on database!`);
        }
        catch (err) {
            console.log('Could not add new chain: ', err);
        }
        return false;
    });
}
//# sourceMappingURL=service.js.map