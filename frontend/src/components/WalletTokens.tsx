import axios from "axios";
import { useEffect, useState } from "react";
import { AlchemyTokenBalance } from "../models/AlchemyTokenBalance";
import { ERC20TransferDirection, ERC20TransferHistory, ERC20Transfers, WalletTrackingData, WalletTrackingPayload } from "../models/ERC20TransferHistory";


const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY as string;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const MAX_TRANSACTIONS_TO_FETCH = 50;

export default function WalletTokens(props: any) {


    

    const [ERC20Tokens, setERC20Tokens] = useState([]);

    const walletAddress: string = props.wallet;

    const [selectedWallet, setSelectedWallet] = useState(walletAddress);

    
    
    useEffect( ()=> {

        if(selectedWallet && selectedWallet.length) {
            getWalletERC20Tokens(walletAddress);
        }
        
    },[]);
    
    async function getWalletERC20Tokens(walletAddress: string): Promise<any> {

        let body = {
          address: walletAddress
        }
        let response = await axios.post("http://localhost:3000/dev/wallettokens", body);
        console.log(`on frontend erc20 tokens for wallet ${walletAddress} response is: `,response);
        setERC20Tokens(response.data);
    }

    function getListElements() {
        let list: any = ERC20Tokens.map( (token: AlchemyTokenBalance) =>  {

            return (
                <li className="li-no-style ml-30" key={token.token_address}> {token.token_name} {token.token_symbol} {token.token_address} {token.token_balance}</li>
            )
        });
        return list;
    }

    //layout

    if(!selectedWallet) {
        return (
            <div>NO DATA/WALLET</div>
        )
    }

    return (
        <div>
            {getListElements()}
            <button onClick={ () => startTrackingWallet()}>Start traking wallet token transfers</button>
            <button onClick={ () => loadHistory()}>Load Transfer History</button>
        </div>
    )


//     //{
//     "added": true,
//     "data": {
//         "user_id": "paulo_cristo",
//         "wallet": "0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88"
//     }
// }
    async function startTrackingWallet() {

      //data about wallet and network (unique way to identify a wallet)
      let walletData: WalletTrackingData = {
        wallet: selectedWallet,
        network: 'ethereum'
      }
      //POST request, with info about the user tracking this wallet
      //if there are multiple users tracking the same wallet for the same network we do not need to repeat/duplicate the logs data
      let payload: WalletTrackingPayload = {
          user_id: 'paulo_cristo',
          data: walletData
      }
 

      try {
        let response = await axios.post("http://localhost:3000/dev/trackwallet", payload);
        console.log("on frontend startTrackingWallet response is: ",response);
    
      }catch(ex) {
        console.error('error on startTrackingWallet: ', ex);
      }
    }

    //no final do array estao os mais recentes, comecar para trás ir buscar apenas 50 transfers
    async function loadHistory() {

        try {

            const wallet: string = selectedWallet;// event.body.wallet; //wallet to get logs for
            let block: string = "0x0";// event.body.block; //start block
            if(!block) {
              block = "0x0";
            }
        
          console.log("Getting event logs for wallet: ", wallet);  
        
          let payload: string = JSON.stringify({
              "jsonrpc": "2.0",
              "id": 0,
              "method": "alchemy_getAssetTransfers",
              "params": [
                {
                  "fromBlock": block,
                  "fromAddress": wallet,
                  "category": ["erc20"] //only track erc20 transfers for now
                }
              ]
            });
        
            let requestOptions = {
              method: 'post',
              headers: { 'Content-Type': 'application/json' },
              data: payload,
            };
        
          
          const axiosURL = `${baseURL}`;
        
          let response = await axios(axiosURL, requestOptions)
          console.log("Logs result: ");
          console.log(JSON.stringify(response.data, null, 2));


          let walletData: WalletTrackingData = {
            wallet: selectedWallet,
            network: 'ethereum'
          };
          let data: WalletTrackingPayload = {
            user_id: "paulo_cristo", 
            data: walletData
          };

          //will do everything in one call, start tracking the data and save the logs
        
          let history: ERC20TransferHistory = {
            data: data,
            records: mapResults(response.data.result.transfers)
          }


          console.log("HISTORY FOR SERVER: ", history);

         
            
          }catch(ex) {
        
            console.error("got error", ex);
          }
    }

    function mapResults(data: any): ERC20Transfers[] {

      let payload: any = data; 
      //get only the last X elems (last ones are more recent)
      if(data.length > MAX_TRANSACTIONS_TO_FETCH) {
        payload = data.slice(-MAX_TRANSACTIONS_TO_FETCH);
      }
      let result: ERC20Transfers[] = payload.map( (elem: any) => {


        /**
         * export type ERC20Transfers = {
          hash: string;
          token_name: string;
          token_address: string;
          value: number;
          block: number; //block to get the timestamp
          direction: string ;//ERC20TransferDirection
          }
         */

          let value: ERC20Transfers = {
            hash: elem.hash,
            token_name: elem.asset,
            token_address: elem.rawContract.address,
            value: elem.value,
            block: elem.blockNum, //block to get the timestamp
            direction: (walletAddress === elem.from) ? ERC20TransferDirection.DIRECTION_OUT : ERC20TransferDirection.DIRECTION_IN //ERC20TransferDirection
          }

          return value;
        /**
         * {
        "blockNum": "0x1093513",
        "uniqueId": "0x0c20e71fd0b4e9175eba7cfcf224e5650a0cc097fbbe0d9c780041c6b5b7de01:log:221",
        "hash": "0x0c20e71fd0b4e9175eba7cfcf224e5650a0cc097fbbe0d9c780041c6b5b7de01",
        "from": "0xb66f07d7bf1f048ea0600b3e6eb480eda951392a",
        "to": "0x3a49fdeeabe2ef0d85b0eeaecaeaa883e1f5cd10",
        "value": 13389.7824286699,
        "erc721TokenId": null,
        "erc1155Metadata": null,
        "tokenId": null,
        "asset": "LOVE",
        "category": "erc20",
        "rawContract": {
          "value": "0x02d5dc8f30c47c710914",
          "address": "0xb22c05cedbf879a661fcc566b5a759d005cf7b4c",
          "decimal": "0x12"
        }
      },
         */
      })
      return result;
    }

}

