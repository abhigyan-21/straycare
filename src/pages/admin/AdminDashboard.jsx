import { Target, HeartHandshake, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
    return (
        <div>
            <h2 className="admin-page-title admin-mb-24">Dashboard Overview</h2>

            <div className="admin-dashboard-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon green">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="admin-stat-title">Active Rescues</p>
                        <p className="admin-stat-value">24</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <div className="admin-stat-icon light">
                        <HeartHandshake size={24} />
                    </div>
                    <div>
                        <p className="admin-stat-title">Adoptions Pending</p>
                        <p className="admin-stat-value">12</p>
                    </div>
                </div>

                <div className="admin-stat-card red-border">
                    <div className="admin-stat-icon red">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="admin-stat-title">Urgent Cases</p>
                        <p className="admin-stat-value">5</p>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="admin-card-title">Recent Activity</h3>
                <p className="admin-card-subtitle">No recent activity to show.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
