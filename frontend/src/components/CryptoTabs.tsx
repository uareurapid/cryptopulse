import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Top50Tokens from './Top50Tokens';
import Top10Cryptos from './Top10Cryptos';
import WalletTokens from './WalletTokens';
import eventBus from "../utils/EventBus";
import TokenTop10Holders from './TokenTop10Holders';
import { useState } from 'react';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


const TABS_INDEX = {

  TAB_50_TOKENS: 0,
  TAB_10_COINS: 1
}

//https://mui.com/material-ui/react-tabs/

export default function CryptoTabs() {

  const [reload50TokensCount, setReload50TokensCount] = useState(0);

  const [selectedToken, setSelectedToken] = useState(null);
  const [value, setValue] = useState(0);
 
  eventBus.on("top_wallets_for_token", (data: any) => {
    console.log("got even dispatched: ", data.token);
    if(data.token) {
      
      setValue(3);
      setSelectedToken(data.token);
    }

  });
  

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if(newValue === TABS_INDEX.TAB_50_TOKENS) {
      setReload50TokensCount(reload50TokensCount+1);
    }
  };

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  

  const reload50Tokens: boolean = (reload50TokensCount === 0) ? true: false;
  return (
    <div>
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Top 50 ETH tokens" {...a11yProps(0)} />
          <Tab label="Top 10 Coins (by market cap)" {...a11yProps(1)} />
          <Tab label="Wallet Token Holdings" {...a11yProps(2)} />
          <Tab label="Top Wallets for Token" {...a11yProps(3)} />
          <Tab label="Following" {...a11yProps(4)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Top50Tokens reload={reload50Tokens}></Top50Tokens>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Top10Cryptos></Top10Cryptos>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <WalletTokens></WalletTokens>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <TokenTop10Holders address={selectedToken}></TokenTop10Holders>
      </TabPanel>
      <TabPanel value={value} index={4}>
        Following
      </TabPanel>
    </Box>
    </div>
  );
}
