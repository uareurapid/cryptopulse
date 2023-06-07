import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const ETHERSCAN_API_URL = "https://api.etherscan.io/";
const api_key = "IAWMMS1HSVZZA61T5V8ZMX8XGN78Q9FUK2";

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
export default function Address() {

    const [top10Holders, setTop10Holders] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();
    
    const walletAddress: string = searchParams.get("wallet") || "NA";
    console.log("got walletd address: " + walletAddress);

    useEffect( ()=> {

        getTokenTopHolders(walletAddress);
    },[]);

    return (
        <div>
            <h3>Wallet Address {walletAddress} details</h3>
            <div>{getListElements()}</div>
        </div>
    )


    function getListElements() {
        let list: any = top10Holders.map( (address: any) =>  {

            return (
                <li className="li-no-style ml-30" key={address.address}>{address.address} {address.balance} {address.share}</li>
            )
        });
        return list;
    }


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