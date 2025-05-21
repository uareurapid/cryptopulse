import FollowingWallets from '../components/wallets/FollowingWallets'
import SelectTrackWallet from '../components/wallets/SelectTrackWallet'
import { startTrackingWallet } from '../utils/CommonUtils'
import styles from './pages.module.css'


export default function TrackedWallets() {

// get all tokens from a wallet (alkemy API or etherscan)
// use Opensea API(for ERC721), etherscan ERC721 is paid
//You don't actually have to query all contracts ever You can get the history for an account and 
// //query all the contracts they've interacted with that use you abis of choice erc20/721/1155 etc for that 
// //accounts balances.
// TODO make a component to input addres and network
    return (
        <div id="tracked_wallets" className={`tracked_wallets content-box ${styles.displayNone}`}>
            <h3>Wallets you're following</h3>
            
            <FollowingWallets></FollowingWallets>
            
            {/*<button onClick={ () => startTrackingWallet('0x75e89d5979e4f6fba9f97c104c2f0afb3f1dcb88')}>Start traking wallet token transfers</button>-->*/}
            <SelectTrackWallet></SelectTrackWallet>
        </div>
    )
}