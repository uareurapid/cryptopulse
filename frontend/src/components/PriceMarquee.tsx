import { useState } from 'react';
import TokenTop10Holders from './TokenTop10Holders';
import eventBus from "../utils/EventBus";
import Marquee from "react-easy-marquee";

import '../css/marquee.css';

//https://github.com/jagnani73/react-easy-marquee
//https://jagnani73.github.io/react-easy-marquee/
export default function PriceMarquee() {


    let initialIds: any[] = [];
    let saveIds: any = window.localStorage.getItem("top-10-ids");
    if(saveIds) {
        try {
            let savedData = JSON.parse(saveIds);
            console.log("Initial ids are: ", savedData);
            initialIds = savedData;
        }catch(err) {
            console.error(err);
        }
        
    }

    const [coinIds, setCoinIds] = useState(initialIds);

    eventBus.on("load-top-10", (data: any) => {
        console.log("got even dispatched: ", data.ids);
        if(data.ids) {
          
          setCoinIds(data.ids)
        }
    
      });

    const backgroundColors = {
        earth: "transparent",
        solarSystem: "transparent",
        buffer: "transparent",
    }

    const reverse = true;

    return(
        <div>
            
            <div style={{ height: "200px" }}>
            <Marquee duration={100000} reverse={reverse} background="wheat" height="250px">
                {getListElements()}
            </Marquee>
        </div>
        </div>
        
    )

    function getListElements() {

        let list: any = coinIds.map( (elem: any) => {
            const symbol = elem.symbol;
            const price = Number(elem.quote.USD.price).toFixed(2);
    
            const changeAsNum: number =  Number(elem.quote.USD.percent_change_24h);
            const change24h = changeAsNum.toFixed(2)  + ' %';
            console.log(symbol, price, change24h);
            return (
    
                <div key={`child2-${elem.id}`} className="marquee-box">
                   <br/>
                   <div>{symbol} {price} USD</div> 
                   <br/>
                   <div>24h: <span style={{color: getColor(changeAsNum)}}>{change24h} {printArrow(changeAsNum)}</span></div>
                </div>
            
              
            )
        });
    
        return list;
        
     
    }

    function printArrow(changeAsNum: number) {
        if(changeAsNum > 0) {
            return (
                <span>&uarr;</span>
            )
        }
            
        return (
            <span>&darr;</span>
        )
    }

    function getColor(num: number): string {
        return num < 0 ? "red": "green";
    }

      /*
fully_diluted_market_cap: 542167191541.65

last_updated: "2023-06-12T06:18:00.000Z"

market_cap: 500857278731.8398

market_cap_dominance: 47.7915

percent_change_1h: 0.01660554

percent_change_7d: -3.71920926

percent_change_24h: -0.03050325

percent_change_30d: -3.45657569

percent_change_60d: -14.21831794

percent_change_90d: 5.31380128

price: 25817.48531150712

tvl: null

volume_24h: 11437519016.193438

volume_change_24h: -26.7213
      */
}