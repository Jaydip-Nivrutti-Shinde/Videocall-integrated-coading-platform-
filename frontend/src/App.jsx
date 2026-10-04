import './App.css'
import { Routes, Route,Navigate } from "react-router";
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from "react";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminPanel from "./components/AdminPanel";
import AdminDelete from "./components/AdminDelete";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";

// import AdminPanel from "./components/AdminPanel";

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
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
      <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
      <Route path="/problem/:problemId" element={<ProblemPage/>}></Route>
      <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
      <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />



    </Routes>
    </>
    
  )
}

export default App;
