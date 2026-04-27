import { BarChart2, Calendar, Download, TrendingUp, Heart, Target, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/admin/StatCard';

const AdminReports = () => {
    const [dateRange, setDateRange] = useState({ start: '2026-04-01', end: '2026-04-30' });

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Reports & Analytics</h2>
                    <p className="admin-page-subtitle">Analyze platform growth and performance over time.</p>
                </div>
                <button className="admin-btn-primary">
                    <Download size={18} /> Export PDF Report
                </button>
            </div>

            <div className="admin-card">
                <div className="admin-flex-between">
                    <h3 className="admin-card-title" style={{ margin: 0 }}>Select Duration</h3>
                    <div className="admin-flex-row">
                        <div className="admin-date-input">
                            <label>From</label>
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div className="admin-date-input">
                            <label>To</label>
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                        <button className="admin-btn-action primary-flex">Apply Filter</button>
                    </div>
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <StatCard 
                    icon={Heart} 
                    title="Total Adoptions" 
                    value="156" 
                    colorClass="green" 
                />
                <StatCard 
                    icon={Target} 
                    title="Successful Rescues" 
                    value="432" 
                    colorClass="light" 
                />
                <StatCard 
                    icon={TrendingUp} 
                    title="User Growth" 
                    value="+15%" 
                    colorClass="primary" 
                />
                <StatCard 
                    icon={IndianRupee} 
                    title="Total Donations" 
                    value="₹2,84,500" 
                    colorClass="green" 
                />
            </div>

            <div className="admin-grid-2">
                <div className="admin-card">
                    <h3 className="admin-card-title">Adoption Trends</h3>
                    <div className="admin-chart-placeholder">
                        <BarChart2 size={48} className="admin-empty-text" />
                        <p className="admin-empty-text">Adoption chart visualization goes here.</p>
                    </div>
                </div>
                <div className="admin-card">
                    <h3 className="admin-card-title">Rescue Distribution</h3>
                    <div className="admin-chart-placeholder">
                        <TrendingUp size={48} className="admin-empty-text" />
                        <p className="admin-empty-text">Rescue analytics visualization goes here.</p>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="admin-card-title">Campaign Performance Summary</h3>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Goal</th>
                                <th>Raised</th>
                                <th>Status</th>
                                <th>Efficiency</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Summer Water Bowl Drive</td>
                                <td>₹50,000</td>
                                <td>₹42,000</td>
                                <td><span className="admin-badge green">Active</span></td>
                                <td>84%</td>
                            </tr>
                            <tr>
                                <td>Central Park Rescue Center</td>
                                <td>₹5,00,000</td>
                                <td>₹2,10,000</td>
                                <td><span className="admin-badge light">Ongoing</span></td>
                                <td>42%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
