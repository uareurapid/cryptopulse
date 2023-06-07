import axios from "axios";
import { useEffect, useState } from "react";
import { AlchemyTokenBalance } from "../models/AlchemyTokenBalance";

export default function WalletTokens(props: any) {


    const [ERC20Tokens, setERC20Tokens] = useState([]);

    const walletAddress: string = props.wallet;

    const [selectedWallet, setSelectedWallet] = useState(walletAddress);
    
    useEffect( ()=> {

        if(selectedWallet) {
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
        </div>
    )

}

