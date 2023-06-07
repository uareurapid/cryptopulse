import logo from './logo.svg';
import './App.css';

import { Routes, Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import Address from './pages/Address';

function App() {


  return (

    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="Address" element={<Address />} />
      </Routes>
      </BrowserRouter>
    </div>
  ) 
   
}


export default App;
