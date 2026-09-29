import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Routes, Route } from "react-router";
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import HomePage from './pages/HomePage';

function App() {
  return(
    <>
    <Routes>
      <Route path='/' element={<HomePage></HomePage>}></Route>
      <Route path='/login' element={<Login></Login>}></Route>
      <Route path='/signup' element={<SignUp></SignUp>}></Route>
    </Routes>
    </>
    
  )
}

export default App
