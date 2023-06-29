import Grid from "@mui/material/Grid";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from "react";
import axios from "axios";

export const FollowingTypes = {
    WALLET: "wallet",
    TOKEN: "token"
}



export default function Following(props: any) {

    const type: string = props.type || FollowingTypes.WALLET;

    const [trackedTokens, setTrackedTokens] = useState([]);
    const [trackedWallets, setTrackedWallets] = useState([]);

    async function getTrackedTokens (user_id: string) {
    
        let body = {
            user_id: user_id
        }
        let response = await axios.post("http://localhost:3000/dev/get_tracked_tokens", body);
        console.log(`on frontend get tracked tokens for user id ${user_id} response is: `,response);
        if(response.status === 200 && response.data.data.tokens) {
            setTrackedTokens(JSON.parse(response.data.data.tokens));
        }
          
    }

    async function getTrackedWallets (user_id: string) {
    
        let body = {
            user_id: user_id
        }
        let response = await axios.post("http://localhost:3000/dev/get_tracked_wallets", body);
        console.log(`on frontend get tracked wallets for user id ${user_id} response is: `,response);
        if(response.status === 200 && response.data.data.wallets) {
            setTrackedWallets(JSON.parse(response.data.data.wallets));
        }
          
    }


    useEffect(() => {

        getTrackedTokens("paulo_cristo");
        getTrackedWallets("paulo_cristo");
    },[])


    function getExplorerLink(network: string, address: string) {
        if(network === "ethereum") {
            return "https://etherscan.io/address/" + address;
        }
        return "www.google.com";
    } 
    //map and order for display the list of tracked tokens
    function getListTokens() {

        if(!trackedTokens || !trackedTokens.length) {
            return (
                <div>N/A</div>
            )
        }

        let list = trackedTokens.map( (token: any, i: number) => {
            return <li className="li-no-style" key={i}> <a target="_blank" href={getExplorerLink(token.network, token.token)}> {token.token}</a> {token.network}</li>
        })
        return list;
    }

    //map and order for display the list of tracked wallets
    function getListWallets() {

        if(!trackedWallets || !trackedWallets.length) {
            return (
                <div>N/A</div>
            )
        }

        let list = trackedWallets.map( (wallet: any, i: number) => {
            return <li className="li-no-style" key={i}><a target="_blank" href={getExplorerLink(wallet.network, wallet.wallet)}> {wallet.wallet}</a> {wallet.network}</li>
        })
        return list;
    }

    return (
        <div className="following-container">
        <Grid container spacing={2}>
            <Grid xs={6}>
                <div className="accordion-container">
                <Accordion>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    >
                    <Typography>Wallets</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    {getListWallets()}
                    </AccordionDetails>
                </Accordion>
                </div>
            </Grid>
            <Grid xs={6}>
                <div className="accordion-container">
                <Accordion>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2a-content"
                    id="panel2a-header"
                    >
                    <Typography>Tokens</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    {getListTokens()}
                    </AccordionDetails>
                </Accordion>
                </div>
            </Grid>
        </Grid>
        </div>
    )

}