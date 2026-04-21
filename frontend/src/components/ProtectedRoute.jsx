import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!isLoggedIn || !user) {
        // If user is not logged in, redirect to home.
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If logged in but doesn't have the required role, redirect to safe zone
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
