import logo from './logo.svg';
import './App.css';
import Top10 from './components/Top10Cryptos';
import FearAndGreedChart from './components/FearAndGreedChart';
import Top50Tokens from './components/Top50Tokens';
import Top10Cryptos from './components/Top10Cryptos';


function App() {

 
 

  return (
    <div className="App">
      {/*<header className="App-header">
      
  </header>*/}

      {/*see https://canvas-gauges.com/documentation/examples/ */}
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





export default App;
