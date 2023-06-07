import axios from "axios";
import { useEffect, useState } from "react";
import ImageComponent from "./ImageComponent";
import Top50TokenETHList from "./Top50TokenETHList";
import '../css/top50.css'
import { Link } from 'react-router-dom';

//https://betterprogramming.pub/exploring-caching-techniques-in-react-d30bbb78d54d
/*
const MyMemoizedFunction = (age: any) => {
  if(Cache.hasKey(age)) {
    return cache.get(age);
  }
  const value = `You are ${age} years old!`;
  cache.set(age, value);
  return value;
}*/


export default function Top50Tokens(props: any) {

  const [top50Tokens, setTop50Tokens] = useState([]);


    useEffect( () => {

      if(props.reload) {
        getTop50Tokens();
        console.log("top50 tokens", top50Tokens);
      }
      
  }, []);


  if(!top50Tokens || !top50Tokens.length) {
    return (
      <div>NO DATA!</div>
    )
  } 
  
  return (
      <div>
      {getListElements()}
      </div>
  )
  
    

  function getListElements() {

    let list: any = top50Tokens.map( (token: any) =>  {

        const src = `https://ethplorer.io${token.image}`;
        const tokenAddr = `https://etherscan.io/address/${token.address}`;

        const link = `/Token?address=${token.address}`;
        return (
                
          <div className="listTop50ActiveTokens">
            <div className="listTop50ActiveTokens-container">
            <ImageComponent imageURL={src} cssClass="listTop50ActiveTokens-img"/>
            </div>
            <li className="li-no-style ml-30" key={token.address}><strong>{token.name}</strong> <a target="_blank" href={tokenAddr}>{token.address}</a></li>
            <Link className="ml-20 link-button" to={link} >Top Holders</Link>
          </div>
        )

    });

    return list;
  }


 

  async function getTop50Tokens() {

    try {
      let response = await axios.get("http://localhost:3000/dev/toptokens");
      console.log("on frontend response is: ",response);
      if(response.data) {
        setTop50Tokens(response.data);
      }
    }catch(ex) {
      console.error(ex);
    }
    
  } 

}