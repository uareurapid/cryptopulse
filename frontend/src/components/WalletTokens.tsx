import axios from "axios";
import { useEffect, useState } from "react";
import { AlchemyTokenBalance } from "../models/AlchemyTokenBalance";


const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY as string;
const baseURL = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;


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
            <button onClick={ () => loadHistory()}>Load Transfer History</button>
        </div>
    )


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
                  "category": ["erc20"]
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
         
            return {
              statusCode: 200,
              body: JSON.stringify(response.data),
            };
          }catch(ex) {
        
            console.error("got error", ex);
          }
    }

}

