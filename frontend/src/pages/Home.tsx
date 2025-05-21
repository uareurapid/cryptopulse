import styles from './pages.module.css'
import SideBar from "../components/Sidebar";
import Header from "../components/Header";
import Dashboard from "./dashboard";
import Analytics from "./analytics";
import Settings from "./settings";
import Profile from "./profile";
import Top10Cryptos from "./top10cryptos";
import Top50Tokens from "./top50tokens";
import TrackedTokens from "./trackedtokens";
import TrackedWallets from "./trackedwallets";
export default function Home() {
  

    return (
   
      <div className="Main">
        <SideBar></SideBar>
          <div className={styles.mainContent}>
          <Header></Header>
          <Dashboard></Dashboard>
          <Analytics></Analytics>
          <Settings></Settings>
          <Profile></Profile>
          <Top10Cryptos></Top10Cryptos>
          <Top50Tokens></Top50Tokens>
          <TrackedTokens></TrackedTokens>
          <TrackedWallets></TrackedWallets>
          </div>
          
      </div>
       
       
      );

}
// <PriceMarquee></PriceMarquee>
//     {/* Main Content */}
//  {/*<div className="Home">

//           <div className="chart-container">
//            <div className="chart-title"><h3>Bitcoin Fear & Greed index</h3></div>
//               <FearAndGreedChart></FearAndGreedChart>
//             </div>
//             <div className="mt-20">
//             <CryptoTabs></CryptoTabs>
//               <hr/>
              
//             </div>
//             <PriceMarquee></PriceMarquee>
//         </div>}*/}