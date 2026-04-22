import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, redirectTo = "/", unauthorizedRedirect, children }) => {
    const { user, isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a loading spinner
    }

    if (!isLoggedIn || !user) {
        // If user is not logged in, redirect to specified path (usually /login)
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If logged in but doesn't have the required role
        // Redirect to unauthorized page if provided, otherwise to the main redirectTo path
        return <Navigate to={unauthorizedRedirect || redirectTo} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
