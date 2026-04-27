import { Routes, Route, Navigate } from 'react-router-dom';
import VetDashboard from "./pages/vet/VetDashboard";
import VetAdopt from "./pages/vet/VetAdopt";
import VetLogin from "./pages/vet/VetLogin";
import VetStatus from "./pages/vet/VetStatus";
import VetCampaign from "./pages/vet/VetCampaign";
import VetProfile from "./pages/vet/VetProfile";
import VetTracking from "./pages/vet/VetTracking";
import VetRescuers from "./pages/vet/VetRescuers";
import VetNavbar from "./components/vet/VetNavbar";
import Guide from "./pages/user/Guide"
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import './styles/global.css'
import Footer from "./components/Footer";

function VetApp() {
  const { isLoggedIn, user, isLoading } = useAuth();

  // Authorized roles: VET, NGO
  const isAuthorized = isLoggedIn && user && ['VET', 'NGO'].includes(user.role);

  if (isLoading) return <div>Loading Portal...</div>;

  return (
    <>
      {isAuthorized && <VetNavbar />}
      <Routes>
        <Route
          path="login"
          element={isAuthorized ? <Navigate to="/vet/dashboard" replace /> : <VetLogin />}
        />

        {/* Centralized protection for all professional vet and NGO routes */}
        <Route element={<ProtectedRoute allowedRoles={['VET', 'NGO']} redirectTo="/vet/login" unauthorizedRedirect="/vet/login" />}>
          <Route path="/" element={<Navigate to="/vet/dashboard" replace />} />
          <Route path="dashboard" element={<VetDashboard />} />
          <Route path="adopt" element={<VetAdopt />} />
          <Route path="status" element={<VetStatus />} />
          <Route path="campaign" element={<VetCampaign />} />
          <Route path="profile" element={<VetProfile />} />
          <Route path="rescuers" element={<VetRescuers />} />
          <Route path="tracking/:id" element={<VetTracking />} />
          <Route path="guide" element={<Guide />} />
          {/* Add more protected routes here */}
        </Route>

        <Route path="*" element={<Navigate to={isAuthorized ? "/vet/dashboard" : "/vet/login"} replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default VetApp;
