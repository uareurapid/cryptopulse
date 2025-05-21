import { showContent } from "../utils/CommonUtils";

import '../css/sidebar.css'
import FearAndGreedChart from "./FearAndGreedChart";
export default function SideBar() {

    return (
        <div className="sidebar">
        <ul>
            <li className="menu-item">
            <FearAndGreedChart></FearAndGreedChart>   
            </li>
            <li className="menu-item active" onClick={ () => showContent('dashboard')}>Dashboard</li>
            <li className="menu-item" onClick={ () => showContent('analytics')}>Analytics</li>
            <li className="menu-item" onClick={ () => showContent('settings')}>Settings</li>
            <li className="menu-item" onClick={()=>showContent('profile')}>Profile</li>
            <li className="menu-item" onClick={()=>showContent('top_10_coins')}>Top 10 (coinmarket)</li>
            <li className="menu-item" onClick={()=>showContent('top_50_tokens')}>Top 50 tokens (ethereum)</li>
            <li className="menu-item" onClick={()=>showContent('tracked_tokens')}>Tracked tokens (ethereum)</li>
            <li className="menu-item" onClick={()=>showContent('tracked_wallets')}>Tracked wallets (ethereum)</li>
        </ul>
    </div>
    )
}