import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import Privacy from "./pages/Privacy"
import Profile from "./pages/user/Profile";
import LiveTracking from "./pages/user/LiveTracking";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/user/Register";
import RescuerDashboard from "./pages/user/RescuerDashboard";
import RescuerNavigation from "./pages/user/RescuerNavigation";
import PublicPartner from "./pages/user/PublicPartner";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import doctorClosed from "./assets/images/doctor-closed.png";
import doctorOpen from "./assets/images/doctor-open.png";
import FloatingRescueButton from "./components/FloatingRescueButton";
import Loader from "./components/Loader";
const AdminApp = lazy(() => import("./AdminApp"));
const VetApp = lazy(() => import("./VetApp"));
import { useAuthStore } from "./store/authStore";

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

import dogRun1 from "./assets/loader/dog_run1.webp";
import dogRun2 from "./assets/loader/dog_run2.webp";
import catRun1 from "./assets/loader/cat_run1.webp";
import catRun2 from "./assets/loader/cat_run2.webp";

// Layout for the main user-facing application
const UserLayout = ({ openAuthModal }) => (
  <>
    <Navbar openAuthModal={openAuthModal} />
    <main>
      <Outlet />
    </main>
    <Footer />
    <FloatingRescueButton />
  </>
);

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const [appLoading, setAppLoading] = useState(() => {
    const isPortalRoute = window.location.pathname.startsWith('/vet') || window.location.pathname.startsWith('/admin');
    return !isPortalRoute;
  });

  const { isFirstLogin, clearFirstLogin, isLoggedIn, user } = useAuthStore();
  const hasLoadedInitial = useRef(false);

  useEffect(() => {
    const isPortalRoute = window.location.pathname.startsWith('/vet') || window.location.pathname.startsWith('/admin');
    if (isPortalRoute) return;

    if (isLoggedIn && user && !user.isEmailVerified) {
      const mode = 'verify-email';
      if (!isAuthModalOpen || authMode !== mode) {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
      }
    }
  }, [isLoggedIn, user, isAuthModalOpen, authMode]);

  useEffect(() => {
    const isPortalRoute = window.location.pathname.startsWith('/vet') || window.location.pathname.startsWith('/admin');
    if (isPortalRoute) {
      return;
    }

    if (hasLoadedInitial.current && !isFirstLogin) {
      return;
    }

    if (hasLoadedInitial.current && isLoggedIn && user && !user.isEmailVerified) {
      if (isFirstLogin) {
        clearFirstLogin();
      }
      return;
    }

    setAppLoading(true);

    const criticalImages = [
      doctorClosed,
      doctorOpen,
      dogRun1,
      dogRun2,
      catRun1,
      catRun2
    ];

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = resolve; // Continue even if one fails
      });
    };

    const startTime = Date.now();
    const minimumLoadingTime = 2000; // 2 seconds

    Promise.all(criticalImages.map(preloadImage)).then(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

      setTimeout(() => {
        setAppLoading(false);
        hasLoadedInitial.current = true;
        if (isFirstLogin) {
          clearFirstLogin();
        }
      }, remainingTime);
    });
  }, [isFirstLogin, clearFirstLogin]);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>      <Analytics />
      <SpeedInsights />
      {appLoading && <Loader />}
      <BrowserRouter>
        <Routes>
          {/* Portals - These have their own internal Layouts and Navbars */}
          <Route path="/admin/*" element={<Suspense fallback={<Loader />}><AdminApp /></Suspense>} />
          <Route path="/vet/*" element={<Suspense fallback={<Loader />}><VetApp /></Suspense>} />

          {/* Main User App Routes */}
          <Route element={<UserLayout openAuthModal={openAuthModal} />}>
            <Route path="/" element={<Home />} />
            <Route path="/adopt" element={<Adopt />} />
            <Route path="/emergency" element={<Emergency openAuthModal={openAuthModal} />} />
            <Route path="/track" element={<Track />} />
            <Route path="/live-track/:reportId" element={<LiveTracking />} />
            <Route path="/about" element={<About />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/post" element={<Post openAuthModal={openAuthModal} />} />
            <Route path="/help" element={<Help openAuthModal={openAuthModal} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/register" element={<Register />} />
            <Route path="/partner/:id" element={<PublicPartner />} />

            {/* Rescuer Section Paths */}
            <Route path="/rescuer" element={<ProtectedRoute allowedRoles={['RESCUER', 'ADMIN']} />}>
              <Route path="dashboard" element={<RescuerDashboard />} />
              <Route path="nav/:reportId" element={<RescuerNavigation />} />
            </Route>

            {/*Footer routes*/}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<FAQ />} />
          </Route>
        </Routes>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </BrowserRouter>
    </>
  );
}

export default App;