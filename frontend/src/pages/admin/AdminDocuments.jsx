import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, Upload, Check, X, FileCheck, Building2, UserX } from 'lucide-react';
import { getAdminDocs, getPartnerApplications, updateAdminUserStatus } from '../../services/api';

const AdminDocuments = () => {
    const [docs, setDocs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'applications'
    const [actioningId, setActioningId] = useState(null); // tracking loading state for single button actions

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docsData, appsData] = await Promise.all([
                getAdminDocs(),
                getPartnerApplications()
            ]);
            setDocs(docsData);
            setApplications(appsData);
        } catch (error) {
            console.error("Failed to fetch verification data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (appId) => {
        if (!window.confirm("Are you sure you want to approve this partner?")) return;
        setActioningId(appId);
        try {
            await updateAdminUserStatus(appId, 'Active');
            alert("Partner approved successfully! They can now log in to the portal.");
            // Remove from local list
            setApplications(applications.filter(app => app.id !== appId));
        } catch (error) {
            console.error("Approval failed:", error);
            alert("Failed to approve partner: " + (error.response?.data?.error || error.message));
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async (appId) => {
        if (!window.confirm("Are you sure you want to reject this partner application? They will receive a rejection notification email.")) return;
        setActioningId(appId);
        try {
            await updateAdminUserStatus(appId, 'Rejected');
            alert("Partner application rejected. A notification email has been sent to them.");
            // Remove from local list
            setApplications(applications.filter(app => app.id !== appId));
        } catch (error) {
            console.error("Rejection failed:", error);
            alert("Failed to reject partner: " + (error.response?.data?.error || error.message));
        } finally {
            setActioningId(null);
        }
    };

    if (loading) return <div className="admin-loading">Loading Verification Board...</div>;

    // Filter out partner registration documents from the main documents list
    const standardDocs = docs.filter(doc => doc.type !== 'REGISTRATION');

    return (
        <>
        <Helmet>
            <title>Furzo Admin - Verification & Documents</title>
            <meta name="description" content="Review partner applications and manage verification documents submitted to the Furzo platform." />
        </Helmet>
        <div className="verification-page">
            <div className="admin-page-header">
                <h2 className="admin-page-title">Verification & Enrollments</h2>
                {activeTab === 'documents' && (
                    <button className="admin-btn-primary">
                        <Upload size={18} /> Upload Document
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="admin-mb-24 admin-tabs-container" style={{ borderBottom: '1px solid #eef2f5', marginBottom: '24px' }}>
                <div className="admin-tabs" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className={`admin-tab ${activeTab === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documents')}
                        style={{
                            padding: '10px 20px',
                            fontWeight: '600',
                            borderBottom: activeTab === 'documents' ? '3px solid #346c02' : '3px solid transparent',
                            background: 'none',
                            color: activeTab === 'documents' ? '#346c02' : '#718096',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Verification Documents ({standardDocs.length})
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                        style={{
                            padding: '10px 20px',
                            fontWeight: '600',
                            borderBottom: activeTab === 'applications' ? '3px solid #346c02' : '3px solid transparent',
                            background: 'none',
                            color: activeTab === 'applications' ? '#346c02' : '#718096',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Partner Applications ({applications.length})
                    </button>
                </div>
            </div>

            {/* Content Tab 1: Documents */}
            {activeTab === 'documents' && (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Document Name</th>
                                <th>Uploaded By</th>
                                <th>Date Uploaded</th>
                                <th>Size</th>
                                <th className="center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standardDocs.map(doc => (
                                <tr key={doc.id}>
                                    <td>
                                        <div className="admin-flex-row">
                                            <div className="admin-badge green" style={{ padding: '8px', marginRight: '12px' }}>
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <span className="admin-text-primary" style={{ fontWeight: '600' }}>{doc.title}</span>
                                                <span className="admin-badge light" style={{ fontSize: '0.7rem', padding: '2px 8px', marginLeft: '8px' }}>{doc.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{doc.owner}</td>
                                    <td>{doc.date}</td>
                                    <td>{doc.size}</td>
                                    <td className="center">
                                        <button className="admin-action-btn green" style={{ background: '#eefcf3', color: '#10b981', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {standardDocs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="center admin-empty-text" style={{ padding: '40px', color: '#718096' }}>
                                        No verification documents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Content Tab 2: Partner Applications */}
            {activeTab === 'applications' && (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Organization Info</th>
                                <th>Role Type</th>
                                <th>Reg. / License No.</th>
                                <th>Address</th>
                                <th>Contact Details</th>
                                <th className="center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app.id}>
                                    <td>
                                        <div className="admin-flex-row">
                                            <div className="admin-badge green" style={{ padding: '8px', marginRight: '12px', background: '#ecfdf5', color: '#047857' }}>
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <span className="admin-text-primary" style={{ fontWeight: '600', display: 'block' }}>{app.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#718096' }}>Applied: {app.appliedDate}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="admin-badge light" style={{ 
                                            textTransform: 'uppercase', 
                                            fontSize: '0.75rem', 
                                            padding: '4px 10px', 
                                            fontWeight: '600',
                                            borderRadius: '12px',
                                            background: app.role === 'ngo' ? '#e0f2fe' : '#fef3c7',
                                            color: app.role === 'ngo' ? '#0369a1' : '#b45309'
                                        }}>
                                            {app.role === 'ngo' ? 'NGO' : 'Clinic'}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontWeight: '500', color: '#4a5568' }}>{app.registrationNumber}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.address}>
                                        {app.address}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '500', color: '#2d3748' }}>{app.email}</div>
                                            <div style={{ color: '#718096', marginTop: '2px' }}>{app.phone}</div>
                                        </div>
                                    </td>
                                    <td className="center">
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                onClick={() => handleApprove(app.id)} 
                                                className="admin-btn-action primary-flex"
                                                disabled={actioningId === app.id}
                                                style={{
                                                    background: '#346c02',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Check size={16} /> Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(app.id)} 
                                                className="admin-btn-action danger-flex"
                                                disabled={actioningId === app.id}
                                                style={{
                                                    background: '#e0645c',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <X size={16} /> Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {applications.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="center admin-empty-text" style={{ padding: '40px', color: '#718096' }}>
                                        No pending partner applications.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    );
};

export default AdminDocuments;
