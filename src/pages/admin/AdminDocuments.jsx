import { FileText, Download, Upload } from 'lucide-react';

const mockDocs = [
    { id: 'DOC-101', title: 'Medical History - Bella', type: 'PDF', size: '2.4 MB', date: '2026-03-08' },
    { id: 'DOC-102', title: 'Adoption Agreement Form', type: 'DOCX', size: '1.1 MB', date: '2026-03-01' },
    { id: 'DOC-103', title: 'NGO Verification - Helping Paws', type: 'PDF', size: '3.5 MB', date: '2026-02-15' }
];

const AdminDocuments = () => {
    return (
        <div>
            <div className="admin-page-header">
                <h2 className="admin-page-title">Documents Management</h2>
                <button className="admin-btn-primary">
                    <Upload size={18} /> Upload Document
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Document Name</th>
                            <th>Date Uploaded</th>
                            <th>Size</th>
                            <th className="center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockDocs.map(doc => (
                            <tr key={doc.id}>
                                <td>
                                    <div className="admin-flex-row">
                                        <div className="admin-stat-icon green" style={{ padding: '10px' }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <span className="admin-text-primary">{doc.title}</span>
                                            <span className="admin-badge rounded admin-btn-action secondary">{doc.type}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{doc.date}</td>
                                <td>{doc.size}</td>
                                <td className="center">
                                    <button className="admin-action-btn green">
                                        <Download size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDocuments;
