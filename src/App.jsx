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
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTracking from "./pages/admin/AdminTracking";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminAdoptions from "./pages/admin/AdminAdoptions";
import AdminContent from "./pages/admin/AdminContent";
import AdminUsers from "./pages/admin/AdminUsers";
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
        <Route path="/post" element={<Post openAuthModal={openAuthModal} />} />
        <Route path="/help" element={<Help />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Section Paths */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'partner', 'ngo']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="adoptions" element={<AdminAdoptions />} />

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="content" element={<AdminContent />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Route>
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