import './App.css'
import { Routes, Route, Navigate } from "react-router";
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from "react";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminPanel from "./components/AdminPanel";
import AdminDelete from "./components/AdminDelete";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import MeetingRoom from "./pages/MeetingRoom";
import VideoCallButton from "./components/videoCall/VideoCallButton";

function App() {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // meeting state — jab set ho to overlay render hoga
  const [activeMeeting, setActiveMeeting] = useState(null);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  const showVideoCallButton =
    isAuthenticated && user?.role !== 'admin' && !activeMeeting;

  return (
    <>
      <Routes>
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/signup" />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
        <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
        <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <AdminDelete /> : <Navigate to="/" />} />
        <Route path="/problem/:problemId" element={<ProblemPage />} />
        <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo /> : <Navigate to="/" />} />
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminUpload /> : <Navigate to="/" />} />
      </Routes>

      {/* Video Call FAB — only for logged-in non-admin users, when not in a meeting */}
      {showVideoCallButton && (
        <VideoCallButton
          username={user?.firstName || ""}
          onStartMeeting={(code) => setActiveMeeting(code)}
        />
      )}

      {/* Floating meeting overlay — appears OVER any page, no background */}
      {activeMeeting && (
        <MeetingRoom
          roomCode={activeMeeting}
          onEndCall={() => setActiveMeeting(null)}
        />
      )}
    </>
  )
}

export default App;