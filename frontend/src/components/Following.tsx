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


    async function getTrackedTokens (user_id: string) {
    
        let body = {
            user_id: user_id
        }
        let response = await axios.post("http://localhost:3000/dev/get_tracked_tokens", body);
        console.log(`on frontend get tracked tokens for user id ${user_id} response is: `,response);
        if(response.status === 200 && response.data.tokens) {
            setTrackedTokens(JSON.parse(response.data.tokens));
        }
          
    }


    useEffect(() => {

        //getTrackedTokens("paulo_cristo");
    },[])


    function getList() {

        if(!trackedTokens || !trackedTokens.length) {
            return (
                <div>NADA</div>
            )
        }

        let list = trackedTokens.map( (token: any, i: number) => {
            return <li className="li-no-style" key={i}>{i} {token.token} {token.network}</li>
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
                    OLA MUNDO
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
                    {getList()}
                    </AccordionDetails>
                </Accordion>
                </div>
            </Grid>
        </Grid>
        </div>
    )

}