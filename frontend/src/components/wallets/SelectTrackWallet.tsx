import { Network } from "../../models/Network";
import { DEFAULT_SUPPORTED_NETWORKS, startTrackingWallet } from "../../utils/CommonUtils"
import AvailableNetworks from "../AvailableNetworks"
import React, { useState } from "react";


export default function SelectTrackWallet() {

    const [walletAdddress, setWalletAdddress] = useState('');
    const [chainSelected, setSelectedChain] = useState(DEFAULT_SUPPORTED_NETWORKS.DEVELOPMENT)
    return (
        <div>
            <h3>Track new wallet</h3>
            <AvailableNetworks onNetworkChange={handleNetworkChange}></AvailableNetworks>
            <input onChange={(e) => handleChange(e)} value={walletAdddress} id="select-wallet-input" required/>
            <button onClick={ () => trackWallet()}>Start tracking wallet</button>
        </div>
    )

    function trackWallet() {
        if(walletAdddress && walletAdddress.startsWith('0x')) {
            startTrackingWallet(walletAdddress, chainSelected.chain_name)
        } else alert('wallet address cannot be empty!')
        
    }

    function handleNetworkChange(network: Network) {
        console.log('selected callback with network: ', network)
        setSelectedChain(network)
    }

    function handleChange(e: any) {
        alert(e.target.value)
        setWalletAdddress(e.target.value)
    }

}