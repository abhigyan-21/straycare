import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/user/Home";
import Adopt from "./pages/user/Adopt";
import Emergency from "./pages/user/Emergency";
import Track from "./pages/user/Track";
import About from "./pages/user/About";
import Guide from "./pages/user/Guide";
import Post from "./pages/user/Post";
import Help from "./pages/user/Help";
import Profile from "./pages/user/Profile";
import LiveTracking from "./pages/user/LiveTracking";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/user/Register";
import RescuerDashboard from "./pages/user/RescuerDashboard";
import RescuerNavigation from "./pages/user/RescuerNavigation";
import { useState, useEffect } from "react";
import doctorClosed from "./assets/images/doctor-closed.png";
import doctorOpen from "./assets/images/doctor-open.png";
import { RescueProvider } from "./context/RescueContext";
import FloatingRescueButton from "./components/FloatingRescueButton";

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  useEffect(() => {
    const img1 = new Image();
    img1.src = doctorClosed;
    const img2 = new Image();
    img2.src = doctorOpen;
  }, []);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <RescueProvider>
      <BrowserRouter>
        <Navbar openAuthModal={openAuthModal} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/adopt" element={<Adopt />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/track" element={<Track />} />
          <Route path="/live-track/:reportId" element={<LiveTracking />} />
          <Route path="/about" element={<About />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/post" element={<Post openAuthModal={openAuthModal} />} />
          <Route path="/help" element={<Help />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register" element={<Register />} />

          {/* Rescuer Section Paths (Temporarily allowing 'user' for demo/testing) */}
          <Route path="/rescuer" element={<ProtectedRoute allowedRoles={['rescuer', 'admin', 'user']} />}>
            <Route path="dashboard" element={<RescuerDashboard />} />
            <Route path="nav/:reportId" element={<RescuerNavigation />} />
          </Route>


        </Routes>
        <Footer />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
        <FloatingRescueButton />
      </BrowserRouter>
    </RescueProvider>
  );
}

export default App;