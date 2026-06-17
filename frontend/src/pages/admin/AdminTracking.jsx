import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Edit2, Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import AdminBadge from '../../components/admin/AdminBadge';
import { getAdminTracking } from '../../services/api';

const AdminTracking = () => {
    const [trackingList, setTrackingList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getAdminTracking();
            setTrackingList(data);
            setLoading(false);
        };
        fetchData();
    }, []);
    const [searchTerm, setSearchTerm] = useState('');

    if (loading) return <div className="admin-loading">Loading Tracking Data...</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return "red";
            case 'Rescue in Progress': return "green";
            case 'At Clinic': return "light";
            case 'Treated': return "green";
            default: return "primary";
        }
    };

    const filteredList = trackingList.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tableHeaders = [
        { label: 'ID & Name' },
        { label: 'Location' },
        { label: 'Report Date' },
        { label: 'Current Status' },
        { label: 'Action', center: true }
    ];

    return (
        <>
            <Helmet>
                <title>Furzo Admin - Pet Tracking</title>
                <meta name="description" content="Monitor and manage all active pet rescue tracking entries in the Furzo admin panel." />
            </Helmet>
            <div>
                <div className="admin-page-header">
                    <h2 className="admin-page-title">Pet Tracking Management</h2>

                    <div className="admin-search-wrapper">
                        <Search size={18} className="admin-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-search-input"
                        />
                    </div>
                </div>

                <AdminTable headers={tableHeaders}>
                    {filteredList.map((item) => (
                        <tr key={item.id}>
                            <td>
                                <span className="admin-text-primary">{item.id}</span>
                                <span className="admin-text-secondary">{item.name} ({item.type})</span>
                            </td>
                            <td>{item.location}</td>
                            <td>{item.date}</td>
                            <td>
                                <AdminBadge rounded color={getStatusColor(item.status)}>
                                    {item.status}
                                </AdminBadge>
                            </td>
                            <td className="center">
                                <button className="admin-action-btn green" title="Update Status">
                                    <Edit2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredList.length === 0 && (
                        <tr>
                            <td colSpan="5" className="center admin-empty-text">No tracked pets found.</td>
                        </tr>
                    )}
                </AdminTable>
            </div>
        </>
    );
};

export default AdminTracking;
