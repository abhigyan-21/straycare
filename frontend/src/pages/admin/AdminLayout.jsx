import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Target, FileText, Users, Edit3, LogOut, BarChart2, Search, ShieldAlert } from "lucide-react";
import "../../styles/admin/admin.css";

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
                    <NavLink to="/admin/documents" className={({ isActive }) => (isActive ? "active" : "")}>
                        <FileText size={20} />
                        Verification
                    </NavLink>

                    {/* Admin Exclusive Links */}
                    {user?.role?.toLowerCase() === "admin" && (
                        <>
                            <div className="nav-divider"></div>
                            <p className="nav-section-title">Moderation</p>
                            <NavLink to="/admin/content" className={({ isActive }) => (isActive ? "active" : "")}>
                                <ShieldAlert size={20} />
                                Content Moderation
                            </NavLink>
                            <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
                                <Users size={20} />
                                User Management
                            </NavLink>
                            <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? "active" : "")}>
                                <BarChart2 size={20} />
                                Reports & Analytics
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="logout-btn" onClick={() => window.location.href = '/'}>
                        <LogOut size={20} />
                        Exit Admin
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h3>{user?.name ? `Hello, ${user.name.split(' ')[0]}!` : 'Welcome back!'}</h3>
                    </div>
                    
                    <div className="admin-header-right" style={{ gap: '24px' }}>
                        <div className="admin-search-wrapper">
                            <Search size={18} className="admin-search-icon" />
                            <input type="text" placeholder="Quick search..." className="admin-search-input" />
                        </div>
                        <div className="admin-header-profile">
                            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=5ebd3e&color=fff&bold=true`} alt="Profile" />
                        </div>
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
