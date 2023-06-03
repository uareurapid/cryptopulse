import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';
import Top50TokenListEthereum from './components/Top50TokenListEthereum';
import Top10 from './components/Top10';


const chartStyle = {
  height: '250px',
  with: '200px',
}


function App() {

  const [fearAndGreedIndex, setFearAndGreedIndex] = useState(20);
  const [top50Tokens, setTop50Tokens] = useState([]);

  useEffect(() => {
      loadIndex();
      getTop50Tokens();
      console.log("top50 tokens", top50Tokens);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
      
      </header>

      {/*see https://canvas-gauges.com/documentation/examples/ */}
      <div className="chart-container">
       <span className="chart-title">Fear & Greed</span>
      <GaugeChart nrOfLevels={20}
        arcWidth={0.3} 
        textColor='#000'
        percent={fearAndGreedIndex} 
        style={chartStyle}

        ></GaugeChart>
        </div>

        <div>
        <Top50TokenListEthereum tokensList={top50Tokens}/>
        </div>
        
        <div>
        <Top10/>
        </div>
   
    </div>
  );

 
  

  async function loadIndex() {

    console.log("did mount");
  
    fetch('https://api.alternative.me/fng/?limit=7')
    .then(response => response.json())
    .then((jsonData) => {
      // jsonData is parsed json object received from url
      console.log("got data...");
      console.log(jsonData);
      let data = [];
      data = jsonData.data;
      if(data && data.length > 0) {
        console.log("set value fear greed to",data[0].value);
        setFearAndGreedIndex(Number(data[0].value/100));
      }
    })
    .catch((error) => {
      // handle your errors here
      console.error("error:" + error);
    })
  
    
  }
  
  
   async function getTop50Tokens() {
  
    let apiKey = process.env.REACT_APP_ETHPLORER_KEY;
    console.log("API KEY: " + apiKey);
    let response = await axios.get(`https://api.ethplorer.io/getTopTokens?apiKey=${apiKey}`);
    console.log(response);
    if(response.data && response.data.tokens) {
      setTop50Tokens(response.data.tokens);
      
    }
  } 
}





export default App;
