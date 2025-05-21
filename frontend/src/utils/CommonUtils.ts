import memoize from "lodash.memoize";
import { TokenTrackingData, TokenTrackingPayload } from "../models/TokenTrakingPayload";
import axios from "axios";
import { WalletTrackingData, WalletTrackingPayload } from "../models/ERC20TransferHistory";
import eventBus from "./EventBus";



export const DEVELOPMENT_CHAIN_ID = 8996
export const DEFAULT_SUPPORTED_NETWORKS = {
    ETHEREUM: {chain_name: 'ethereum', chain_id: 1},
    DEVELOPMENT: {chain_name: 'development', chain_id: DEVELOPMENT_CHAIN_ID}
}

export function invalidateCache(functionRef: any) {

    if(typeof functionRef === 'function') {
      functionRef.cache = new memoize.Cache();
    }
    
}

export function getTokenAPIEndpoint() {
  const server = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'
  const apiEndpoint = '/api/tokens'
  const url = `${server}${apiEndpoint}`
  return url
}

export function getWalletAPIEndpoint(): string {
  const server = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'
  const apiEndpoint = '/api/wallets'
  const url = `${server}${apiEndpoint}`
  return url
}

export function getExplorerLink(network: string, address: string) {
  if(network === DEFAULT_SUPPORTED_NETWORKS.ETHEREUM.chain_name) {
      return "https://etherscan.io/address/" + address;
  }
  return "www.google.com";
} 

// Function to display content based on the selected menu item
export function showContent(section: any) {
  // Hide all sections
  const sections = document.querySelectorAll('.content-box');
  sections.forEach( (theSection: any) => {
    theSection.style.display = 'none';
  });

  // Show the selected section
  const selectedSection = document.getElementById(section)
  if(selectedSection) {
    selectedSection.style.display = 'block';
  }
  

  // Update active class in the sidebar
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
      item.classList.remove('active');
  });
  const activeItem = document.querySelector(`[onclick="showContent('${section}')"]`);
  if(activeItem) {
    activeItem.classList.add('active');
  }
  
}

export async function startTrackingWallet(walletAddress: string, network?:string) {

  //data about wallet and network (unique way to identify a wallet)
  let walletData: WalletTrackingData = {
    wallet: walletAddress,
    network: network || 'ethereum'
  }
  //POST request, with info about the user tracking this wallet
  //if there are multiple users tracking the same wallet for the same network we do not need to repeat/duplicate the logs data
  let payload: WalletTrackingPayload = {
      user_id: 'paulo_cristo',
      data: walletData
  }


  try {
    let response = await axios.post(`${getWalletAPIEndpoint()}/track_wallet`, payload);
    console.log("on frontend startTrackingWallet response is: ",response);

    eventBus.dispatch(eventBus.EVENTS.START_TRACKING_WALLET, { message: "start tracking wallet", wallet: walletAddress, network: "ethereum" });

  }catch(ex) {
    console.error('error on startTrackingWallet: ', ex);
  }
}
 //it should go the the following panel, which is splitted between tokens and wallets
 export async function startTrackingToken(tokenAddress: string, network?: string) {

  //data about wallet and network (unique way to identify a wallet)
  let tokenData: TokenTrackingData = {
    token: tokenAddress,
    network: network || 'ethereum'
  }
  //POST request, with info about the user tracking this wallet
  //if there are multiple users tracking the same wallet for the same network we do not need to repeat/duplicate the logs data
  let payload: TokenTrackingPayload = {
      user_id: 'paulo_cristo',
      data: tokenData
  }

  console.log('payload is: ', payload)

  try {
    let response = await axios.post(`${getTokenAPIEndpoint()}/track_token`, payload);
    console.log("on frontend startTrackingToken response is: ",response);

  }catch(ex) {
    console.error('error on startTrackingToken: ', ex);
  }
}

export async function getAvailableNetworks(): Promise <any> {
    
  console.log('process.env.REACT_APP_BACKEND_URL: ', process.env.REACT_APP_BACKEND_URL)
  try {
      const server = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'
      const url = `${server}/api/chains/available`;
      const networksData: any = await axios.get(url);
      if(networksData.data) {
          console.log("Supported networks: ", Object.values(networksData.data));
          return Object.values(networksData.data);
      }
      console.log('got nothing')
      return Object.values(DEFAULT_SUPPORTED_NETWORKS)
      /**
       * array of {chainName: name, chainId: id}
       * */ 
      
      //setTop10(rankingsData.data.data);
      
      
  }catch(ex) {
      console.error(ex);
      return Object.values(DEFAULT_SUPPORTED_NETWORKS)
  }
  //setRankings(rankingsData);

}