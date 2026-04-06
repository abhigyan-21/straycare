import { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';

const mockRequests = [
    { id: 'ADPT-421', applicant: "Sarah Connor", petName: "Max", type: "Dog", date: "2026-03-08", status: "Pending", phone: "+1 234 567 890" },
    { id: 'ADPT-422', applicant: "Bruce Wayne", petName: "Luna", type: "Cat", date: "2026-03-06", status: "Pending", phone: "+1 987 654 321" },
    { id: 'ADPT-423', applicant: "Clark Kent", petName: "Bella", type: "Dog", date: "2026-03-05", status: "Approved", phone: "+1 555 123 456" },
];

const AdminAdoptions = () => {
    const [requests, setRequests] = useState(mockRequests);

    const handleStatusUpdate = (id, newStatus) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    const pendingRequests = requests.filter(req => req.status === 'Pending');
    const pastRequests = requests.filter(req => req.status !== 'Pending');

    return (
        <div>
            <div className="admin-page-header">
                <h2 className="admin-page-title">Adoption Requests</h2>
                <button className="admin-btn-primary">
                    + Add Pet for Adoption
                </button>
            </div>

            <div className="admin-mb-32">
                <h3 className="admin-section-title">Pending Review ({pendingRequests.length})</h3>
                <div className="admin-req-grid">
                    {pendingRequests.map(req => (
                        <div key={req.id} className="admin-req-card">
                            <div className="admin-req-card-header">
                                <span className="admin-req-id">{req.id}</span>
                                <span className="admin-req-date">{req.date}</span>
                            </div>
                            <h4 className="admin-req-name">{req.applicant}</h4>
                            <p className="admin-req-pet">Applying for: <span className="admin-req-pet-bold">{req.petName}</span> ({req.type})</p>

                            <div className="admin-req-actions">
                                <button className="admin-btn-action secondary">
                                    <Eye size={16} /> View
                                </button>
                                <button onClick={() => handleStatusUpdate(req.id, 'Approved')} className="admin-btn-action primary-flex">
                                    <Check size={16} /> Approve
                                </button>
                                <button onClick={() => handleStatusUpdate(req.id, 'Rejected')} className="admin-btn-action danger-flex">
                                    <X size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                    {pendingRequests.length === 0 && <p className="admin-empty-text">No pending adoption requests right now.</p>}
                </div>
            </div>

            <div>
                <h3 className="admin-section-title">Past Responses</h3>
                <div className="admin-table-container">
                    <table className="admin-table">
                        <tbody>
                            {pastRequests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <span className="admin-text-primary">{req.applicant}</span>
                                        <span className="admin-text-secondary">applied for {req.petName}</span>
                                    </td>
                                    <td>{req.date}</td>
                                    <td className="center">
                                        <span className={`admin-badge rounded admin-btn-action ${req.status === 'Approved' ? 'primary' : 'danger'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAdoptions;
