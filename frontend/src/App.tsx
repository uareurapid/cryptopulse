import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import GaugeChart from 'react-gauge-chart';


const chartStyle = {
  height: '250px',
  with: '200px',
}


function App() {

  const [fearAndGreedIndex, setFearAndGreedIndex] = useState(20);
  const [top50Tokens, setTop50Tokens] = useState([]);

  useEffect(() => {
      loadIndex()
  }, []);

  useEffect(() => {
    getTop50Tokens();
    console.log("top50 tokens", top50Tokens);
}, []);

  return (
    <div className="App">
      <header className="App-header">


      
      </header>

      {/*see https://canvas-gauges.com/documentation/examples/ */}
      <div className="chart-container">
      <GaugeChart nrOfLevels={20}
        arcWidth={0.3} 
        percent={fearAndGreedIndex} 
        style={chartStyle}

        ></GaugeChart>
        </div>

        <div>
        <TokenList/>
        </div>
        

   
    </div>
  );

  function TokenList() {
   const list: any = top50Tokens.map( (token: any) => <li>{token.name}</li>);
   return <ol>{list}</ol>
  }
  

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
        setFearAndGreedIndex(Number(data[0].value));
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
