import { Target, HeartHandshake, AlertCircle, Calendar, PlusCircle, UserPlus, FileDown } from "lucide-react";
import StatCard from "../../components/admin/StatCard";

const AdminDashboard = () => {
    return (
        <div>
            <div className="admin-flex-between admin-mb-24">
                <div>
                    <h2 className="admin-page-title">Dashboard Overview</h2>
                    <p className="admin-page-subtitle">Monthly performance metrics at a glance.</p>
                </div>
                <div className="admin-badge rounded admin-btn-action secondary">
                    <Calendar size={14} /> April 2026
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <StatCard 
                    icon={HeartHandshake} 
                    title="Adoptions" 
                    value="12" 
                    colorClass="green" 
                />

                <StatCard 
                    icon={Target} 
                    title="Rescues" 
                    value="24" 
                    colorClass="light" 
                />

                <StatCard 
                    icon={AlertCircle} 
                    title="Active Campaigns" 
                    value="8" 
                    colorClass="red" 
                    borderClass="red-border"
                />

                <StatCard 
                    icon={FileDown} 
                    title="Funds Raised (April)" 
                    value="₹45,200" 
                    colorClass="green" 
                />
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <h3 className="admin-card-title">Quick Actions</h3>
                    <div className="admin-quick-actions">
                        <button className="quick-action-btn">
                            <PlusCircle size={20} />
                            <span>New Post</span>
                        </button>
                        <button className="quick-action-btn">
                            <UserPlus size={20} />
                            <span>Invite Partner</span>
                        </button>
                        <button className="quick-action-btn">
                            <FileDown size={20} />
                            <span>Export Data</span>
                        </button>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="admin-card-title">Recent Activity</h3>
                    <p className="admin-card-subtitle">No recent activity to show for this month.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
