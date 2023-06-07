import FearAndGreedChart from "../components/FearAndGreedChart";
import Top10Cryptos from "../components/Top10Cryptos";
import Top50Tokens from "../components/Top50Tokens";

export default function Home() {

    return (
        <div className="Home">
          <div className="chart-container">
           <span className="chart-title">Bitcoin Fear & Greed index</span>
              <FearAndGreedChart></FearAndGreedChart>
            </div>
    
            <div>
              <h3>Top 50 Ethereum tokens</h3>
             <Top50Tokens></Top50Tokens>
            </div>
            
            <div>
            <h3>Top 10 Cryptos (by market cap)</h3>
            <Top10Cryptos></Top10Cryptos>
            </div>
       
        </div>
      );

}