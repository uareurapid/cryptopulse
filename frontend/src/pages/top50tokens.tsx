import axios from "axios";
import { useEffect, useState } from "react";
import ImageComponent from "../components/ImageComponent";
import '../css/top50.css'
import styles from './pages.module.css' 
// import { Link } from 'react-router-dom';

//https://betterprogramming.pub/exploring-caching-techniques-in-react-d30bbb78d54d

import memoize from "lodash.memoize";
import { getTokenAPIEndpoint, invalidateCache, startTrackingToken } from "../utils/CommonUtils";
import eventBus from "../utils/EventBus";
import { TokenTrackingData, TokenTrackingPayload } from "../models/TokenTrakingPayload";


export async function getTop50TokensData(): Promise<any> {

  try {
    
    let response = await axios.get(`${getTokenAPIEndpoint()}/top_50_tokens`);
    console.log("on frontend response is: ",response.data);
    if(response && response.data) {
      return response.data;
    }
    return []
    

  }catch(ex) {
    console.error(ex);
    return [];
  }
}

const getData = memoize(getTop50TokensData);

//calls CommonUtils
export function invalidateTop50TokensCache() {
  invalidateCache(getData);
}

export default function Top50Tokens(props: any) {

  const [top50Tokens, setTop50Tokens] = useState([]);

    useEffect( () => {

      console.log('Top50Tokens: ', Top50Tokens)
      // getTop50TokensData
      getData().then((data) =>  {
        console.log('received data: ', data)
        setTop50Tokens(data)
    });
      // if(props.reload) {
      //   getTop50Tokens();
      //   console.log("top50 tokens", top50Tokens);
      // }
      
  }, []);


  if(!top50Tokens || !top50Tokens.length) {
    return (
      <div id="top_50_tokens" className={`top_50_tokens content-box ${styles.displayNone}`}>NO DATA!</div>
    )
  } 
  
  return (
      <div id="top_50_tokens" className={`top_50_tokens content-box ${styles.displayNone}`}>
      {getListElements()}
      </div>
  )
  
    

  function getListElements() {

    console.log('list elements: ', top50Tokens)
    let list: any = top50Tokens.map( (token: any) =>  {

        const src = token.image ? `https://ethplorer.io${token.image}` : `https://ethplorer.io/images/tether.png`;
        const tokenAddr = `https://etherscan.io/address/${token.address}`;

        const link = `/Token?address=${token.address}`;
        return (

          
            <div className="listTop50ActiveTokens">
              <div className="listTop50ActiveTokens-container">
              <ImageComponent imageURL={src} cssClass="listTop50ActiveTokens-img"/>
              </div>
              <div className="token_50_list_container">
              <div className="ml-30" key={token.address}><strong>{token.name}</strong> <div className="top_50_tokens_link"><a target="_blank" href={tokenAddr}>{token.address}</a></div></div>
              {/*<Link className="ml-20 link-button" to={link} >Top Holders</Link>*/}
              <button className="button_top_50_tokens" onClick={()=>getTopHolders(token.address)}>Get Top Holders</button>
              <button className="button_top_50_tokens" onClick={()=> startTrackingToken(token.address)}>Start Tracking Token</button>
              </div>
            </div>
          
        )

    });

    return list;
  }

  


  async function getTopHolders(tokenAddress: string) {

    //signal main page and move tabs
    alert("get holders of token: " + tokenAddress);

    eventBus.dispatch(eventBus.EVENTS.GET_TOP_WALLETS_FOR_TOKEN, { message: "get top holders", token: tokenAddress });

  }



  // async function getTop50Tokens() {

  //   try {
  //     let response = await axios.get("http://localhost:3000/dev/toptokens");
  //     console.log("on frontend response is: ",response);
  //     if(response.data) {
  //       setTop50Tokens(response.data);
  //     }
  //   }catch(ex) {
  //     console.error(ex);
  //   }
    
  // } 

}