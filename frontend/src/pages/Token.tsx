import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import WalletTokens from "../components/WalletTokens";

import '../css/token.css';

//const ETHERSCAN_API_URL = "https://api.etherscan.io/";
//const api_key = "IAWMMS1HSVZZA61T5V8ZMX8XGN78Q9FUK2";

/**
 * 
 * @returns Eth balance
 * https://api.etherscan.io/api
   ?module=account
   &action=balance
   &address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae
   &tag=latest
   &apikey=YourApiKeyToken
 */

/**
 * TODO show more details about the token
 * We are showing to 10 wallets
 * and we should compare with market cap supply etc..
 */   
export default function Token() {

    const [top10Holders, setTop10Holders] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const tokenAddress: string = searchParams.get("address") || "NA";
    console.log("got token address: " + tokenAddress);

    useEffect( ()=> {

        getTokenTopHolders(tokenAddress);
    },[]);

    return (
        <div>
            <h3>Token {tokenAddress} Top 10 Holders details</h3>
            <div>{getListElements()}</div>
        </div>
    )


    function getListElements() {
        let list: any = top10Holders.map( (wallet: any) =>  {

            const link: string = `/Wallet?address=${wallet.address}`;
            return (
                <div className="wallet-list-container">
                <li className="li-no-style ml-30" key={wallet.address}>
                    {wallet.address} {wallet.balance} {wallet.share} 
                    <Link className="ml-20 link-button" to={link} >Show wallet ER20 tokens</Link>
                    {/* links to wallet page to see holdings*/}
                </li>
                </div>
            )
        });
        return list;
    }

    async function showERC20Tokens(wallet: string) {
        console.log("Set selected wallet to: ", wallet);
    }


    /**
     * Get the top 10 holders / wallets for the given token (ERC20)
     * @param tokenAddress 
     */
    async function getTokenTopHolders(tokenAddress: string): Promise<any> {

        let body = {
          address: tokenAddress
        }
        let response = await axios.post("http://localhost:3000/dev/topholders", body);
        console.log(`on frontend topholders for token ${tokenAddress} response is: `,response);
        setTop10Holders(response.data);
        /**
         * address
    : 
    "0x075e72a5edf65f0a5f44699c7654c1a76941ddc8"
    balance
    : 
    25062866203422070000
    share
    : 
    42.56
        */
    }
    
}