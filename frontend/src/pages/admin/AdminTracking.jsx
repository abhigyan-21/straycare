import { useState } from 'react';
import { Edit2, Search } from 'lucide-react';

const mockTracking = [
    { id: 'TRK-001', name: "Bella (Stray)", type: "Dog", reporter: "John Doe", status: "Reported", date: "2026-03-08", location: "Downtown Park" },
    { id: 'TRK-002', name: "Luna", type: "Cat", reporter: "Jane Smith", status: "Rescue in Progress", date: "2026-03-07", location: "Northside Alley" },
    { id: 'TRK-003', name: "Max", type: "Dog", reporter: "Mike Ross", status: "At Clinic", date: "2026-03-05", location: "East Ave" },
];

const AdminTracking = () => {
    const [trackingList, setTrackingList] = useState(mockTracking);
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Reported': return "danger-flex red";
            case 'Rescue in Progress': return "primary-flex green";
            case 'At Clinic': return "light";
            case 'Treated': return "primary green";
            default: return "";
        }
    };

    const filteredList = trackingList.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID & Name</th>
                            <th>Location</th>
                            <th>Report Date</th>
                            <th>Current Status</th>
                            <th className="center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredList.map((item) => {
                            const bgClass = getStatusBadgeClass(item.status);
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <span className="admin-text-primary">{item.id}</span>
                                        <span className="admin-text-secondary">{item.name} ({item.type})</span>
                                    </td>
                                    <td>{item.location}</td>
                                    <td>{item.date}</td>
                                    <td>
                                        <span className={`admin-badge rounded admin-btn-action ${bgClass}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="center">
                                        <button className="admin-action-btn green" title="Update Status">
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredList.length === 0 && (
                            <tr>
                                <td colSpan="5" className="center admin-empty-text">No tracked pets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminTracking;
