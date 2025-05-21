import { DEFAULT_SUPPORTED_NETWORKS, getAvailableNetworks } from "../utils/CommonUtils"
import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import memoize from "lodash.memoize";
import { useEffect, useState } from "react";
import { Network } from "../models/Network";


const getData = memoize(getAvailableNetworks)
export default function AvailableNetworks(props: { onNetworkChange: (arg0: Network) => void; }) {

  const [availableNewtworks, setAvailableNetworks] = useState(Object.values(DEFAULT_SUPPORTED_NETWORKS))
  const [selectedNetwork, setSelectedNetwork] = useState(DEFAULT_SUPPORTED_NETWORKS.DEVELOPMENT);

  const handleNetworkChange = (event: SelectChangeEvent) => {
    const chainName = event.target.value
    console.log('selected network: ', chainName) // string
    for(const net of availableNewtworks) {
      if(net.chain_name === chainName) {
        setSelectedNetwork(net)
        if(props.onNetworkChange) {
          props.onNetworkChange(net)
        }
      }
    }

    
  };

  useEffect(()=> {
    getData().then(chains => {
      console.log('chains are: ', chains)
      setAvailableNetworks(chains)
    })
  },[])

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl>
        <InputLabel id="demo-simple-select-label">Available chains</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={selectedNetwork.chain_name}
          label="Available chains"
          onChange={handleNetworkChange}
        >
         {getSupportedNetworks()}
        </Select>
      </FormControl>
    </Box>
  );

  function getSupportedNetworks() {

    return availableNewtworks.map(network => {
        return <MenuItem key={network.chain_name} id={network.chain_name} value={network.chain_name}>{network.chain_name}</MenuItem>
    })
  }
}


// export default function AvailableNetworks() {

//     return (
//         <div>
//             <h3>Available Networks</h3>
//             <div>{getSupportedNetworks()}</div>
//         </div>
//     )

    

    
// }