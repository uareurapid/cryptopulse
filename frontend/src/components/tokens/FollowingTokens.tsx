import Grid from "@mui/material/Grid";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEffect, useState } from "react";
import axios from "axios";
import { FollowingTypes } from "../../utils/Constants";
import { getExplorerLink, getTokenAPIEndpoint } from "../../utils/CommonUtils";
import '../../css/following.css';

export default function FollowingTokens(props: any) {

    const type: string = props.type || FollowingTypes.TOKEN;

    const [trackedTokens, setTrackedTokens] = useState([]);

    async function getTrackedTokens (user_id: string) {
   
        console.log('get tokens tracked for user: ', user_id)
        let response = await axios.get(`${getTokenAPIEndpoint()}/tracked_tokens?user_id=${user_id}`);
        console.log('response is: ', response)
        console.log(`on frontend get tracked tokens for user id ${user_id} response is: `,response.data);
        if(response.status === 200 && response.data.tokens) {
            setTrackedTokens(response.data.tokens); // we already send JSON, no need to parse again
        } else console.log('SOMETHING WRONG?')
          
    }

    useEffect(() => {
        getTrackedTokens("paulo_cristo");
    },[])


    //map and order for display the list of tracked tokens
    function getListTokens() {

        if(!trackedTokens || !trackedTokens.length) {
            return (
                <div>N/A</div>
            )
        }

        let list = trackedTokens.map( (token: any, i: number) => {
            return <li className="li-no-style" key={i}>Token: <a target="_blank" href={getExplorerLink(token.network, token.token)}> {token.token}</a> Network: {token.network}</li>
        })
        return list;
    }

    return (
        <div className="following-container">
        <Grid container spacing={2}>
            <Grid xs={6}>
                <div className="accordion-container">
                <Accordion expanded={trackedTokens.length > 0}>
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