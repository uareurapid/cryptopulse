import axios from "axios";
import { useEffect, useState } from "react";
import GaugeChart from 'react-gauge-chart';
import { getScore } from '../models/FearAndGreedModel';

const chartStyle = {
    height: '250px',
    with: '200px',
}

const legendStyle = {
  paddingTop: '-120px',
}
export default function  FearAndGreedChart() {


    const [fearAndGreedIndex, setFearAndGreedIndex] = useState(0);

    useEffect( () => {
        loadIndex();
        //getTop50Tokens();
        //console.log("top50 tokens", top50Tokens);
    }, [fearAndGreedIndex]);

    return (
      <div>
        <GaugeChart nrOfLevels={20} arcWidth={0.3} textColor='#000' percent={fearAndGreedIndex} style={chartStyle}></GaugeChart>
        <div style={legendStyle}>{fearAndGreedIndex*100} - {getScore(fearAndGreedIndex)}</div>
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
              console.log("set value fear greed to",data[0].value);
              setFearAndGreedIndex(Number(data[0].value/100));
            }
          }
        }
        catch(error) {
          // handle your errors here
          console.error("error:" + error);
        }
      
      }

}