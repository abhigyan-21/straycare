import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const isAuthorized = isLoggedIn && user && ['admin'].includes(user.role);

  if (isLoading) return <div>Loading Admin Portal...</div>;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthorized ? <Navigate to="/admin" replace /> : <AdminLogin />} 
        />
        
        {/* Protection wrapper for all admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/login" unauthorizedRedirect="/login" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/documents" element={<AdminDocuments />}/>
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={isAuthorized ? "/admin" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default AdminApp;
