import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTracking from "./pages/admin/AdminTracking";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminContent from "./pages/admin/AdminContent";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
import AdminLogin from "./pages/admin/AdminLogin";
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import './styles/global.css';

function AdminApp() {
  const { isLoggedIn, user, isLoading } = useAuth();
  
  // Authorized roles for the admin portal
  const isAuthorized = isLoggedIn && user && ['ADMIN'].includes(user.role);

  if (isLoading) return <div>Loading Admin Portal...</div>;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthorized ? <Navigate to="/admin" replace /> : <AdminLogin />} 
      />
      
      {/* Protection wrapper for all admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} redirectTo="/admin/login" unauthorizedRedirect="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/documents" element={<AdminDocuments />}/>
          <Route path="/content" element={<AdminContent />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={isAuthorized ? "/admin" : "/admin/login"} replace />} />
    </Routes>
  );
}

export default AdminApp;
