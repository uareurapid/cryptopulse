import { CryptoPulseDatabase, getDBConnectionURL } from "../db/database.js"
import { isReachableConnection, sleep } from "../utils/util.js"
import { BlockchainTracking } from "./blockchainTracking"

export const crawlingInterval = process.env.INDEXING_INTERVAL ? Number(process.env.INDEXING_INTERVAL) : 20000
// max times to retry start crawling
const MAX_CRAWL_RETRIES = 10
// count crawl attempts
let numCrawlAttempts = 0
export async function canStartCrawler(blockchain: BlockchainTracking): Promise<boolean> {
  if ((await blockchain.isNetworkReady()).ready) {
    return true
  } else {
    // try other RPCS if any available (otherwise will just retry the same RPC)
    const connectionStatus = await blockchain.tryFallbackRPCs()
    if (connectionStatus.ready || (await blockchain.isNetworkReady()).ready) {
      return true
    }
  }
  return false
}

export async function retryCrawlerWithDelay(
  blockchain: BlockchainTracking,
  interval: number = 5000 // in milliseconds, default 5 secs
): Promise<boolean> {
  try {
    const retryInterval = Math.max(blockchain.getKnownRPCs().length * 3000, interval) // give 2 secs per each one
    // try
    const result = await canStartCrawler(blockchain)
    const dbActive = CryptoPulseDatabase.getInstance().getDatabase()
    if (!dbActive || !(await isReachableConnection(getDBConnectionURL()))) {
      console.error(`Giving up start crawling. DB is not online!`)
      console.error(`Make sure the connection properties are valid (check .env vars), and that DB was started (docker-compose up)!`)
      // TODO add a retry command (manually via script or POST admin command)
      return false
    }
    if (result) {
      console.log('Blockchain connection succeffully established!')
      // processNetworkData(blockchain.getProvider(), blockchain.getSigner())
      return true
    } else {
      console.log(
        `Blockchain connection is not established, retrying again in ${
          retryInterval / 1000
        } secs....`
      )
      numCrawlAttempts++
      if (numCrawlAttempts <= MAX_CRAWL_RETRIES) {
        // delay the next call
        await sleep(retryInterval)
        // recursively call the same func
        return retryCrawlerWithDelay(blockchain, retryInterval)
      } else {
        console.log(
          `Giving up start crawling after ${MAX_CRAWL_RETRIES} retries.`
        )
        return false
      }
    }
  } catch (err:any) {
    console.error(`Error starting crawler: ${err.message}`)
    return false
  }
}

export function getCrawlingInterval(increaseFactor: number = 1) {
  return crawlingInterval * increaseFactor
}