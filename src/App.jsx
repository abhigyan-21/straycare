import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Adopt from "./pages/Adopt";
import Emergency from "./pages/Emergency";
import Track from "./pages/Track";
import About from "./pages/About";
import Guide from "./pages/Guide";
import Post from "./pages/Post";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import AuthModal from "./components/AuthModal";
import { useState } from "react";

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <BrowserRouter>
      <Navbar openAuthModal={openAuthModal} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adopt" element={<Adopt />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/track" element={<Track />} />
        <Route path="/about" element={<About />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/post" element={<Post />} />
        <Route path="/help" element={<Help />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </BrowserRouter>
  );
}

export default App;