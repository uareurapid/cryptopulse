import FearAndGreedChart from "../components/FearAndGreedChart";
import Top10Cryptos from "../components/Top10Cryptos";
import Top50Tokens from "../components/Top50Tokens";
import CryptoTabs from "../components/CryptoTabs";


export default function Home() {
  

    return (
        <div className="Home">

          <div className="chart-container">
           <div className="chart-title"><h3>Bitcoin Fear & Greed index</h3></div>
              <FearAndGreedChart></FearAndGreedChart>
            </div>
            
            <div className="mt-20">
            <CryptoTabs></CryptoTabs>
              <hr/>
            </div>
       
        </div>
      );

}