import { Target, HeartHandshake, AlertCircle, Calendar, PlusCircle, UserPlus, FileDown, ShieldAlert } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import { useState, useEffect } from "react";
import { getAdminStats } from "../../services/api";
import { recentActivity } from "../../data/adminMockData";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await getAdminStats();
            setStats(data);
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="admin-loading">Loading Analytics...</div>;

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Dashboard Overview</h2>
                    <p className="admin-page-subtitle">Real-time performance metrics and impact tracking.</p>
                </div>
                <div className="admin-badge light" style={{ padding: '10px 16px' }}>
                    <Calendar size={16} /> {stats?.month || 'April 2026'}
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <StatCard 
                    icon={HeartHandshake} 
                    title="Successful Adoptions" 
                    value={stats?.adoptions || 0} 
                    colorClass="green" 
                />

                <StatCard 
                    icon={Target} 
                    title="Total Rescues" 
                    value={stats?.rescues || 0} 
                    colorClass="light" 
                />

                <StatCard 
                    icon={AlertCircle} 
                    title="Urgent Reports" 
                    value={stats?.urgentReports || 0} 
                    colorClass="red" 
                />

                <StatCard 
                    icon={FileDown} 
                    title="Monthly Funding" 
                    value={stats?.funding || "₹0"} 
                    colorClass="green" 
                />
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <h3 className="admin-card-title">Quick Actions</h3>
                    <p className="admin-card-subtitle">Manage core platform operations.</p>
                    <div className="admin-quick-actions">
                        <button className="quick-action-btn">
                            <PlusCircle size={24} color="#5ebd3e" />
                            <span>New Story</span>
                        </button>
                        <button className="quick-action-btn">
                            <UserPlus size={24} color="#3182ce" />
                            <span>Add Partner</span>
                        </button>
                        <button className="quick-action-btn">
                            <FileDown size={24} color="#e0645c" />
                            <span>Export Report</span>
                        </button>
                        <button className="quick-action-btn">
                            <Calendar size={24} color="#f6ad55" />
                            <span>Events</span>
                        </button>
                        <button className="quick-action-btn" onClick={() => window.location.href = '/admin/content'}>
                            <ShieldAlert size={24} color="#e0645c" />
                            <span>Moderate</span>
                        </button>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="admin-card-title">Community Activity</h3>
                    <div className="admin-activity-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {recentActivity.map(activity => (
                            <div key={activity.id} className="activity-item admin-flex-row" style={{ gap: '16px' }}>
                                <div className={`admin-badge ${activity.type === 'emergency' ? 'red' : activity.type === 'adoption' ? 'green' : 'light'}`} style={{ padding: '8px' }}>
                                    {activity.icon === 'heart' && <HeartHandshake size={14} />}
                                    {activity.icon === 'alert' && <AlertCircle size={14} />}
                                    {activity.icon === 'user' && <UserPlus size={14} />}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{activity.title}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-text-light)' }}>{activity.description} • {activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
