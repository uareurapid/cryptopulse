var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ethers } from "ethers";
import { DEFAULT_CHUNK_SIZE, DEFAULT_RPC_PROVIDERS } from "./Constants.js";
import { BlockchainTracking } from "../crypto/blockchainTracking.js";
import { v4 as uuidv4 } from 'uuid';
import { getSupportedChains } from "../chains/service.js";
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isDefined(something) {
    return something !== undefined && something !== null;
}
/**
 * Check if a given network is supported or not
 * @param chainName the name of the chain
 * @param chainId the id of the chain
 * @returns true or false
 */
export function isSupportedNetwork(chainName, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbData = yield getSupportedChains();
        // map cause DB models have different nomenclature
        const allSupported = dbData.map(chain => {
            return { chainId: chain.chain_id, chainName: chain.chain_name };
        });
        console.log('all supported: ', allSupported);
        const found = allSupported.filter((network) => {
            console.log('checking network: ', network);
            if (network.chainId === chainId || network.chainName === chainName) {
                return network;
            }
        });
        return found.length > 0 ? found[0] : null;
    });
}
export const getNetworkHeight = (provider) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const networkHeight = yield provider.getBlockNumber();
        return networkHeight;
    }
    catch (err) {
        console.log('Unable to get networkHeight:', err);
        return 0;
    }
});
/**
 * Get the RPC definition for the chain
 * @param chain chain id
 * @returns RPC
 * // TODO fallbacks
 */
export function getRPCProviderForNetwork(chain) {
    return __awaiter(this, void 0, void 0, function* () {
        let network = null;
        if (typeof chain === 'number') {
            network = yield isSupportedNetwork(undefined, chain);
        }
        else {
            network = yield isSupportedNetwork(chain);
        }
        if (network) {
            const provider = DEFAULT_RPC_PROVIDERS[network.chainName].default;
            return provider;
        }
        console.error('Unable to get provider for network: ', chain);
        return null;
    });
}
/**
 * get the tracking start block, which is the current network height
 * @param suportedNetwork
 * @returns
 */
export function getStartBlockFromNetworkHeight(suportedNetwork) {
    return __awaiter(this, void 0, void 0, function* () {
        const rpc = yield getRPCProviderForNetwork(suportedNetwork.chainId);
        if (rpc) {
            const tracker = new BlockchainTracking(rpc, suportedNetwork.chainName, suportedNetwork.chainId);
            const provider = tracker.getProvider();
            const block = yield getNetworkHeight(provider);
            console.log('will use start block: ', block);
            return block;
        }
        return -1;
    });
}
export function getCurrentBalance(/*tracker: BlockchainTracking*/ provider, walletAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const balanceWei = yield provider.getBalance(walletAddress);
            // console.log('balance of ' + walletAddress + ' is: ' + Number(ethers.formatEther(balanceWei)))
            return Number(ethers.formatEther(balanceWei));
        }
        catch (ex) {
            console.log('error getting balance: ', ex);
        }
        return 0;
    });
}
export function getTokenBalance(signer, tokenAddress, tokenABI, walletAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
            const decimals = tokenContract.decimals();
            // if ERC721 no need decimals, else if ERC20, need decimals
            const balance = yield tokenContract.balanceOf(walletAddress);
            // console.log('balance of ' + walletAddress + ' is: ' + Number(ethers.formatEther(balanceWei)))
            return Number(balance);
        }
        catch (ex) {
            console.log('error getting balance: ', ex);
        }
        return 0;
    });
}
export function generateUniqueID() {
    return uuidv4();
}
export function getDefaultChunkSize() {
    return process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : DEFAULT_CHUNK_SIZE;
}
// we can use this to check if DB connection is available
export function isReachableConnection(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fetch(url);
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
//# sourceMappingURL=util.js.map