import { Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';

// Mocking useAuth for now. We will wrap the app in an actual AuthProvider later.
export const useAuth = () => {
    // Let's assume the user is an 'admin'. 
    // You can change this to 'partner' to test partner restrictions, or null to test unauthenticated.
    const [user] = useState({
        name: "Admin User",
        role: "admin" // possible values: 'admin', 'partner', 'ngo'
    });

    return { user };
};

const ProtectedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        // If user is not logged in, redirect to home. They can open the auth modal there.
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If logged in but doesn't have the required role, redirect to admin dashboard
        // If they can't even access the dashboard, this might cause a loop, but here the dashboard allows 'partner', 'ngo', and 'admin'.
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
