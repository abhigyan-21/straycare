import { BarChart2, Calendar, Download, TrendingUp, Heart, Target, IndianRupee } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/admin/StatCard';
import { getAdminReports } from '../../services/api';

const AdminReports = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportsData, setReportsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async (start, end) => {
        setLoading(true);
        try {
            const data = await getAdminReports(start, end);
            setReportsData(data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleApplyFilter = () => {
        fetchReports(dateRange.start, dateRange.end);
    };

    return (
        <>
        <Helmet>
            <title>Furzo Admin - Reports</title>
            <meta name="description" content="Analyze platform growth, adoption rates, rescue stats, and campaign performance with Furzo Admin reports." />
        </Helmet>
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
                        <button className="admin-btn-action primary-flex" onClick={handleApplyFilter}>
                            {loading ? 'Loading...' : 'Apply Filter'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-dashboard-grid">
                <StatCard 
                    icon={Heart} 
                    title="Total Adoptions" 
                    value={reportsData?.adoptions ?? "0"} 
                    colorClass="green" 
                />
                <StatCard 
                    icon={Target} 
                    title="Successful Rescues" 
                    value={reportsData?.rescues ?? "0"} 
                    colorClass="light" 
                />
                <StatCard 
                    icon={TrendingUp} 
                    title="User Growth" 
                    value={reportsData?.userGrowth ?? "+0%"} 
                    colorClass="primary" 
                />
                <StatCard 
                    icon={IndianRupee} 
                    title="Total Donations" 
                    value={reportsData?.donations ?? "₹0"} 
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
                            {(reportsData?.campaigns || []).map(campaign => (
                                <tr key={campaign.id}>
                                    <td>{campaign.name}</td>
                                    <td>{campaign.goal}</td>
                                    <td>{campaign.raised}</td>
                                    <td>
                                        <span className={`admin-badge ${campaign.status === 'Active' ? 'green' : 'light'}`}>
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td>{campaign.efficiency}</td>
                                </tr>
                            ))}
                            {(reportsData?.campaigns || []).length === 0 && (
                                <tr>
                                    <td colSpan="5" className="center admin-empty-text" style={{ padding: '20px 0' }}>
                                        No campaigns found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </>
    );
};

export default AdminReports;
