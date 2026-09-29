import './App.css'
import { Routes, Route,Navigate } from "react-router";
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from "react";


function App() {

  const {isAuthenticated,user,loading} = useSelector((state)=>state.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return(
    <>
    <Routes>
      <Route path="/" element={isAuthenticated ?<HomePage></HomePage>:<Navigate to="/signup" />}></Route>
      <Route path="/login" element={isAuthenticated?<Navigate to="/" />:<Login></Login>}></Route>
      <Route path="/signup" element={isAuthenticated?<Navigate to="/" />:<SignUp></SignUp>}></Route>
    </Routes>
    </>
    
  )
}

export default App;
