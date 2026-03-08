import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../components/ProtectedRoute";
import { LayoutDashboard, Target, FileText, HeartHandshake, Users, Edit3, LogOut } from "lucide-react";
import "../../styles/admin.css";

const AdminLayout = () => {
    const { user } = useAuth();

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>StrayCare <span>Admin</span></h2>
                    <p className="role-badge">{user?.role}</p>
                </div>

                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/admin/tracking" className={({ isActive }) => (isActive ? "active" : "")}>
                        <Target size={20} />
                        Pet Tracking
                    </NavLink>
                    <NavLink to="/admin/documents" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FileText size={20} />
                        Documents
                    </NavLink>
                    <NavLink to="/admin/adoptions" className={({ isActive }) => (isActive ? "active" : "")}>
                        <HeartHandshake size={20} />
                        Adoption Requests
                    </NavLink>

                    {/* Admin Exclusive Links */}
                    {user?.role === "admin" && (
                        <>
                            <div className="nav-divider"></div>
                            <p className="nav-section-title">Admin Controls</p>
                            <NavLink to="/admin/content" className={({ isActive }) => (isActive ? "active" : "")}>
                                <Edit3 size={20} />
                                Content & Posts
                            </NavLink>
                            <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
                                <Users size={20} />
                                Manage Users
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="logout-btn">
                        <LogOut size={20} />
                        Exit Admin
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h3>Welcome back, {user?.name}!</h3>
                    <div className="admin-header-profile">
                        <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" />
                    </div>
                </header>

                <div className="admin-content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
