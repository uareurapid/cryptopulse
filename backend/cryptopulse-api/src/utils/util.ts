import { ethers, JsonRpcApiProvider, Signer } from "ethers"
import { SupportedNetwork } from "../types/common.js"
import { DEFAULT_CHUNK_SIZE, DEFAULT_RPC_PROVIDERS, SUPPORTED_NETWORKS } from "./Constants.js"
import { BlockchainTracking } from "../crypto/blockchainTracking.js"
import { v4 as uuidv4 } from 'uuid'
import { getSupportedChains } from "../chains/service.js"
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isDefined(something: any): boolean {
    return something !== undefined && something !== null
}
/**
 * Check if a given network is supported or not
 * @param chainName the name of the chain   
 * @param chainId the id of the chain
 * @returns true or false
 */
export async function isSupportedNetwork(chainName?: string, chainId?: number): Promise<SupportedNetwork | null> {
    const dbData = await getSupportedChains()
    // map cause DB models have different nomenclature
    const allSupported: SupportedNetwork[] = dbData.map( chain => {
        return {chainId: chain.chain_id, chainName: chain.chain_name}
    })
    console.log('all supported: ', allSupported)
    const found = allSupported.filter( (network: SupportedNetwork) => {
        console.log('checking network: ', network)
        if(network.chainId === chainId || network.chainName === chainName) {
            return network
        }
    })
    return found.length > 0 ? found[0] : null
}

export const getNetworkHeight = async (provider: JsonRpcApiProvider) => {
    try {
        const networkHeight = await provider.getBlockNumber()
        return networkHeight
    }catch(err) {
        console.log('Unable to get networkHeight:', err)
        return 0
    }
    
}

/**
 * Get the RPC definition for the chain
 * @param chain chain id
 * @returns RPC
 * // TODO fallbacks
 */
export async function getRPCProviderForNetwork(chain: string | number): Promise<string | null> {
    let network = null
    if(typeof chain === 'number') {
        network = await isSupportedNetwork(undefined, chain)
    } else {
        network = await isSupportedNetwork(chain)
    }
    if(network) {
        const provider = DEFAULT_RPC_PROVIDERS[network.chainName].default
        return provider
    }
    console.error('Unable to get provider for network: ', chain)
    return null
}

/**
 * get the tracking start block, which is the current network height
 * @param suportedNetwork 
 * @returns 
 */
export async function getStartBlockFromNetworkHeight(suportedNetwork: SupportedNetwork): Promise<number> {
    const rpc = await getRPCProviderForNetwork(suportedNetwork.chainId)
    if(rpc) {
        const tracker = new BlockchainTracking(rpc, suportedNetwork.chainName, suportedNetwork.chainId)
        const provider = tracker.getProvider()
        const block = await getNetworkHeight(provider)
        console.log('will use start block: ', block)
        return block
    }
    return -1
    
}

export async function getCurrentBalance(/*tracker: BlockchainTracking*/ provider: JsonRpcApiProvider, walletAddress: string): Promise<number> {
   

    try {
        const balanceWei = await provider.getBalance(walletAddress)
        // console.log('balance of ' + walletAddress + ' is: ' + Number(ethers.formatEther(balanceWei)))
        return Number(ethers.formatEther(balanceWei))
    }
    catch(ex) {
        console.log('error getting balance: ', ex)
    }
    
    return 0
    
}

export async function getTokenBalance(signer: Signer, tokenAddress: string, tokenABI: any, walletAddress: string): Promise<number> {
   

    try {

        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer)
        const decimals = tokenContract.decimals()
        // if ERC721 no need decimals, else if ERC20, need decimals
        const balance = await tokenContract.balanceOf(walletAddress)
        // console.log('balance of ' + walletAddress + ' is: ' + Number(ethers.formatEther(balanceWei)))
        return Number(balance)
    }
    catch(ex) {
        console.log('error getting balance: ', ex)
    }
    
    return 0
    
}


export function generateUniqueID(): string {
  return uuidv4()
}

export function getDefaultChunkSize(): number {
    return process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : DEFAULT_CHUNK_SIZE
}

// we can use this to check if DB connection is available
export async function isReachableConnection(url: string): Promise<boolean> {
  try {
    await fetch(url)
    return true
  } catch (error) {
    return false
  }
}