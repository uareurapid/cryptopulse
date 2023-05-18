import logo from './logo.svg';
import './App.css';
import {RadialGauge} from 'react-canvas-gauges';
import React from 'react'

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: 25
    }
  }
 componentDidMount = async () => {
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
      this.setState({index: data[0].value});
    }
  })
  .catch((error) => {
    // handle your errors here
    console.error("error:" + error);
  })
 }
 render() {
   //defipulse? payed
   //lunarcrush -> ixsl6wcrcgixhu98g9pnd payed except widgets
  //payed
  //cryptoquant endpoint: https://api.cryptoquant.com/v1/
  /**
   * https://api.cryptoquant.com/v1/

├── Bitcoin/
│   ├── Status/                    // status of Bitcoin entity
│   ├── Exchange-Flows/            // on-chain statistics of exchanges
│   ├── Flow-Indicator/            // mpi, whale ratio and other flow indicators
│   ├── Market-Indicator/          // stablecoin supply ratio and other market indicators
│   ├── Network-Indicator/         // nvt, nvt-golden-cross and other network indicators
│   ├── Miner-Flows/               // on-chain statistics of miners
│   ├── Inter-Entity-Flows/        // on-chain statistics of flows between entities
│   ├── Bank-Flows/                // on-chain statistics of banks
│   ├── Fund-Data/                 // fund related data
│   ├── Market-Data/               // price, capitalization
│   └── Network-Data/              // general statistics of Bitcoin network
├── Ethereum/
│   ├── Status/                    // status of Ethereum entity
│   ├── Exchange-Flows/            // on-chain statistics of exchanges
│   ├── Market-Indicator/          // Estimated Leverage Ratio
│   ├── ETH2.0/                    // Ethereum 2.0 statistics
│   ├── Fund-Data/                 // fund related data
│   └── Market-Data/               // price, capitalization, market indicators
├── Stablecoin/
│   ├── Status/                    // status of stablecoin entity
│   ├── Exchange-Flow/             // on-chain statistics of exchanges
│   ├── Market-Data/               // price, capitalization, market indicators
│   └── Network-Data/              // USDT, PAXOS, USDC, DAI, TUSD, SAI
└── ERC20/
    ├── Status/                    // status of erc20 entity
    ├── Exchange-Flow/             // on-chain statistics of exchanges
    └── Market-Data/               // price

   */

  return (
    <div className="App">
      <header className="App-header">
        <div className="top-widget" id="coinmarketcap-widget-marquee" coins="1,1027,825,2010,3408,6636,3890,5426,7278,2,74,1839,3077" currency="USD" theme="dark" transparent="false" show-symbol-logo="true"></div>
        {/*<img src={logo} className="App-logo" alt="logo" />*/}
        {/*<img src="https://alternative.me/crypto/fear-and-greed-index.png" alt="Latest Crypto Fear & Greed Index" />*/}
        <div id="coinmarketcap-widget-coin-price-block" className="mywidget" coins="1,1027,825,2010,74,5426,52,1839,6636,3408" currency="USD" theme="dark" transparent="false" show-symbol-logo="true"></div>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

      {/*see https://canvas-gauges.com/documentation/examples/ */}
      <RadialGauge
        units='Bitcoin'
        title='Fear & Greed'
        width={200}
        height={200}
        value={this.state.index}
        renderTo="mycanvas"
        theme='dark'
        highlights = {[
          { "from": 65, "to": 100, "color": "rgba(0,255,0,.15)" },
          { "from": 35, "to": 65, "color": "rgba(255,255,0,.15)" },
          { "from": 0, "to": 35, "color": "rgba(255,30,0,.25)" }
        ]}
        minValue={0}
        maxValue={100}
        majorTicks={['0','5','10', '15', '20', '25', '30', '35', '40', '45', '50', '55','60','65','70','75','80','85','90','95','100']}
        minorTicks={2}></RadialGauge>
   
   <iframe src="https://lunarcrush.com/widgets/galaxyscore?symbol=eth&interval=1 Week&animation=false&theme=dark" id="galaxy-score" frameBorder="0" border="0" cellspacing="0" scrolling="no" className="lunarcrush"></iframe>
    </div>
  )
 }
}

export default App;
/*
https://api.alternative.me/fng/?limit=7
{
	"name": "Fear and Greed Index",
	"data": [
		{
			"value": "73",
			"value_classification": "Greed",
			"timestamp": "1629849600",
			"time_until_update": "7150"
		},
		{
			"value": "79",
			"value_classification": "Extreme Greed",
			"timestamp": "1629763200"
		},
		{
			"value": "79",
			"value_classification": "Extreme Greed",
			"timestamp": "1629676800"
		},
		{
			"value": "76",
			"value_classification": "Extreme Greed",
			"timestamp": "1629590400"
		},
		{
			"value": "78",
			"value_classification": "Extreme Greed",
			"timestamp": "1629504000"
		},
		{
			"value": "70",
			"value_classification": "Greed",
			"timestamp": "1629417600"
		},
		{
			"value": "70",
			"value_classification": "Greed",
			"timestamp": "1629331200"
		},
		{
			"value": "73",
			"value_classification": "Greed",
			"timestamp": "1629244800"
		},
		{
			"value": "72",
			"value_classification": "Greed",
			"timestamp": "1629158400"
		},
		{
			"value": "72",
			"value_classification": "Greed",
			"timestamp": "1629072000"
		}
	],
	"metadata": {
		"error": null
	}
}
*/