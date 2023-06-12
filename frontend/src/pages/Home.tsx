import FearAndGreedChart from "../components/FearAndGreedChart";
import CryptoTabs from "../components/CryptoTabs";
import PriceMarquee from "../components/PriceMarquee";

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
            <PriceMarquee></PriceMarquee>
        </div>
      );

}