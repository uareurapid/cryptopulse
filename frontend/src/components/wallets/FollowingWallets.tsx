import Grid from "@mui/material/Grid";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from "react";
import axios from "axios";
import { FollowingTypes } from "../../utils/Constants";
import { getExplorerLink } from "../../utils/CommonUtils";

import '../../css/following.css';

export default function FollowingWallets(props: any) {

    const type: string = props.type || FollowingTypes.WALLET;

    const [trackedWallets, setTrackedWallets] = useState([]);

    async function getTrackedWallets (user_id: string) {
    
        console.log('get wallets tracked for user: ', user_id)
        const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'
        console.log('url: ', url)

        let response = await axios.get(`${url}/api/wallets/tracked_wallets?user_id=${user_id}`);
        console.log(`on frontend get tracked wallets for user id ${user_id} response is: `,response.data);
        if(response.status === 200 && response.data.wallets) {
            setTrackedWallets(response.data.wallets);
        }
          
    }


    useEffect(() => {

        getTrackedWallets("paulo_cristo");
    },[])


    //map and order for display the list of tracked wallets
    function getListWallets() {

        if(!trackedWallets || !trackedWallets.length) {
            return (
                <div>N/A</div>
            )
        }

        let list = trackedWallets.map( (wallet: any, i: number) => {
            return <li className="li-no-style" key={i}>Wallet: <a target="_blank" href={getExplorerLink(wallet.network, wallet.wallet)}> {wallet.wallet}</a> Network: {wallet.network}</li>
        })
        return list;
    }

    return (
        <div className="following-container">
        <Grid container spacing={2}>
            <Grid xs={6}>
                <div className="accordion-container">
                <Accordion expanded={trackedWallets.length > 0}>
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
        </Grid>
        </div>
    )

}