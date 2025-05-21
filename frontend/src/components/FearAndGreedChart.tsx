import axios from "axios";
import { useEffect, useState } from "react";
import GaugeChart from 'react-gauge-chart';
import { getScore } from '../models/FearAndGreedModel';

import styles from '../pages/pages.module.css'
const chartStyle = {
    height: '70px',
    width: '85%',
    margin: '0 auto'
}

const legendStyle = {
  paddingTop: '20px',
  fontWeight: 'bold'
}
export default function  FearAndGreedChart() {


    const [fearAndGreedIndex, setFearAndGreedIndex] = useState(0);

    useEffect( () => {
        loadIndex();
        //getTop50Tokens();
        //console.log("top50 tokens", top50Tokens);
    }, [fearAndGreedIndex]);

    return (
      <div className="chart-container">
            <div className="chart-title"><span>Bitcoin Fear & Greed index</span></div>
            <div>
            <GaugeChart className={styles.svgFearGreed} nrOfLevels={20} arcWidth={0.3} textColor='#fff' percent={fearAndGreedIndex/100} style={chartStyle}></GaugeChart>
            <div style={legendStyle}>{fearAndGreedIndex} - {getScore(fearAndGreedIndex)}</div>
          </div>
      </div>
      
    )


    async function loadIndex() {

        console.log("Fear and Greed, did mount");
      
        try {
          let response = await axios.get('https://api.alternative.me/fng/?limit=7');
          if(response) {
            let jsonData: any = response.data;
            // jsonData is parsed json object received from url
            console.log("got data...");
            console.log(jsonData);
            let data = [];
            data = jsonData.data;
            if(data && data.length > 0) {
              let value = Number(data[0].value)
              if(value > 100 ) {
                value = value/100
              }
              console.log("set value fear greed to",value);
              setFearAndGreedIndex(value);//data[0].value/100
            }
          }
        }
        catch(error) {
          // handle your errors here
          console.error("error:" + error);
        }
      
      }

}