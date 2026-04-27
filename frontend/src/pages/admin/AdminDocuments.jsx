import { FileText, Download, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAdminDocs } from '../../services/api';

const AdminDocuments = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocs = async () => {
            const data = await getAdminDocs();
            setDocs(data);
            setLoading(false);
        };
        fetchDocs();
    }, []);

    if (loading) return <div className="admin-loading">Loading Documents...</div>;

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
                        {docs.map(doc => (
                            <tr key={doc.id}>
                                <td>
                                    <div className="admin-flex-row">
                                        <div className="admin-badge green" style={{ padding: '8px' }}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <span className="admin-text-primary">{doc.title}</span>
                                            <span className="admin-badge light" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{doc.type}</span>
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
