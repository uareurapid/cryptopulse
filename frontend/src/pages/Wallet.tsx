import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import WalletTokens from "../components/WalletTokens";

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
export default function Wallet() {

    const [searchParams, setSearchParams] = useSearchParams();
    
    const walletAddress: string = searchParams.get("address") || "NA";
    console.log("got wallet address: " + walletAddress);


    return (
        <div>
            <h3>Wallet {walletAddress} List of ERC20 holdings</h3>
            <WalletTokens wallet={walletAddress}></WalletTokens>
        </div>
    )
    
}