import logo from './logo.svg';
import './App.css';

import { Routes, Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import Token from './pages/Token';
import Wallet from './pages/Wallet';

function App() {


  return (

    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="Token" element={<Token />} />
        <Route path="Wallet" element={<Wallet />} />
      </Routes>
    </div>
  ) 
   
}


export default App;
