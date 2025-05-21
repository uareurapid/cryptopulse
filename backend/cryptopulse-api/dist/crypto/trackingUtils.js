var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CryptoPulseDatabase, getDBConnectionURL } from "../db/database.js";
import { isReachableConnection, sleep } from "../utils/util.js";
export const crawlingInterval = process.env.INDEXING_INTERVAL ? Number(process.env.INDEXING_INTERVAL) : 20000;
// max times to retry start crawling
const MAX_CRAWL_RETRIES = 10;
// count crawl attempts
let numCrawlAttempts = 0;
export function canStartCrawler(blockchain) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((yield blockchain.isNetworkReady()).ready) {
            return true;
        }
        else {
            // try other RPCS if any available (otherwise will just retry the same RPC)
            const connectionStatus = yield blockchain.tryFallbackRPCs();
            if (connectionStatus.ready || (yield blockchain.isNetworkReady()).ready) {
                return true;
            }
        }
        return false;
    });
}
export function retryCrawlerWithDelay(blockchain_1) {
    return __awaiter(this, arguments, void 0, function* (blockchain, interval = 5000 // in milliseconds, default 5 secs
    ) {
        try {
            const retryInterval = Math.max(blockchain.getKnownRPCs().length * 3000, interval); // give 2 secs per each one
            // try
            const result = yield canStartCrawler(blockchain);
            const dbActive = CryptoPulseDatabase.getInstance().getDatabase();
            if (!dbActive || !(yield isReachableConnection(getDBConnectionURL()))) {
                console.error(`Giving up start crawling. DB is not online!`);
                console.error(`Make sure the connection properties are valid (check .env vars), and that DB was started (docker-compose up)!`);
                // TODO add a retry command (manually via script or POST admin command)
                return false;
            }
            if (result) {
                console.log('Blockchain connection succeffully established!');
                // processNetworkData(blockchain.getProvider(), blockchain.getSigner())
                return true;
            }
            else {
                console.log(`Blockchain connection is not established, retrying again in ${retryInterval / 1000} secs....`);
                numCrawlAttempts++;
                if (numCrawlAttempts <= MAX_CRAWL_RETRIES) {
                    // delay the next call
                    yield sleep(retryInterval);
                    // recursively call the same func
                    return retryCrawlerWithDelay(blockchain, retryInterval);
                }
                else {
                    console.log(`Giving up start crawling after ${MAX_CRAWL_RETRIES} retries.`);
                    return false;
                }
            }
        }
        catch (err) {
            console.error(`Error starting crawler: ${err.message}`);
            return false;
        }
    });
}
export function getCrawlingInterval(increaseFactor = 1) {
    return crawlingInterval * increaseFactor;
}
//# sourceMappingURL=trackingUtils.js.map