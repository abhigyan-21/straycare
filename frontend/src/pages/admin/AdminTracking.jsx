import { useState } from 'react';
import { Edit2, Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import AdminBadge from '../../components/admin/AdminBadge';

const mockTracking = [
    { id: 'TRK-001', name: "Bella (Stray)", type: "Dog", reporter: "John Doe", status: "Reported", date: "2026-03-08", location: "Downtown Park" },
    { id: 'TRK-002', name: "Luna", type: "Cat", reporter: "Jane Smith", status: "Rescue in Progress", date: "2026-03-07", location: "Northside Alley" },
    { id: 'TRK-003', name: "Max", type: "Dog", reporter: "Mike Ross", status: "At Clinic", date: "2026-03-05", location: "East Ave" },
];

const AdminTracking = () => {
    const [trackingList, setTrackingList] = useState(mockTracking);
    const [searchTerm, setSearchTerm] = useState('');

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
    );
};

export default AdminTracking;
