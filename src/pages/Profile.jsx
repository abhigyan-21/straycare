import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';
import '../styles/Post.css'; // For create-post-btn styles
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { user: authUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('personal');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);

    const [user, setUser] = useState({
        name: authUser?.name || 'John Doe',
        email: authUser?.email || 'john.doe@example.com',
        phone: '+91 77887 87665',
        joined: 'January 2026',
        avatar: 'https://i.pravatar.cc/150?img=11',
    });

    const [mockPosts, setMockPosts] = useState([
        { id: 1, image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600' },
        { id: 2, image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600' },
        { id: 3, image: 'https://images.unsplash.com/photo-15371608804-ea6f11ccfb76?auto=format&fit=crop&q=80&w=600' },
        { id: 4, image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600' }
    ]);

    const [mockReports, setMockReports] = useState([
        { id: '4435', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', name: 'Bizoo', location: 'Sector 14, Main Road', date: 'Oct 12, 2026' },
        { id: '1092', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=500', name: 'Rusty', location: 'Palm Grove Avenue', date: 'Sep 28, 2026' }
    ]);

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        document.body.style.overflow = 'auto';
    };

    const handleCreatePostSubmit = (newPost) => {
        setMockPosts([{ id: newPost.id, image: newPost.postImage }, ...mockPosts]);
    };

    const [mockDonations, setMockDonations] = useState([
        { id: 1, amount: '$50', date: '2026-03-01', type: 'One-time', to: 'StrayCare General Fund' },
        { id: 2, amount: '$20', date: '2026-02-15', type: 'Monthly Autopay', to: 'Medical Fund' },
    ]);

    const [mockDocuments, setMockDocuments] = useState([
        { id: 1, name: 'Luna_Vaccination_Record.pdf', dateAdded: '2026-02-20', type: 'Medical' },
        { id: 2, name: 'Adoption_Certificate.pdf', dateAdded: '2026-01-15', type: 'Legal' },
    ]);

    const handleSaveDetails = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        setUser({
            ...user,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
        });
        setIsEditingDetails(false);
    };

    const handleDeletePost = (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            setMockPosts(mockPosts.filter(post => post.id !== id));
        }
    };

    const handleCancelDonation = (id) => {
        if (window.confirm('Are you sure you want to cancel this autopay?')) {
            setMockDonations(mockDonations.filter(d => d.id !== id));
        }
    };

    const handleDeleteDocument = (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            setMockDocuments(mockDocuments.filter(doc => doc.id !== id));
        }
    };

    const handleDownloadDocument = (name) => {
        alert(`Downloading ${name}... (Mock)`);
    };

    const handleMockUpload = () => {
        // Trigger the hidden file input
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newDoc = {
                id: Date.now(),
                name: file.name,
                dateAdded: new Date().toISOString().split('T')[0],
                type: 'Uploaded'
            };
            setMockDocuments([...mockDocuments, newDoc]);
            alert(`File "${file.name}" uploaded successfully!`);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <div className="profile-section fade-in">
                        <h2>Personal Details</h2>
                        {isEditingDetails ? (
                            <form className="details-card edit-form" onSubmit={handleSaveDetails}>
                                <div className="detail-item edit">
                                    <label className="label">Full Name</label>
                                    <input name="name" defaultValue={user.name} required className="edit-input" />
                                </div>
                                <div className="detail-item edit">
                                    <label className="label">Email Address</label>
                                    <input name="email" type="email" defaultValue={user.email} required className="edit-input" />
                                </div>
                                <div className="detail-item edit">
                                    <label className="label">Phone Number</label>
                                    <input name="phone" defaultValue={user.phone} required className="edit-input" />
                                </div>
                                <div className="detail-item">
                                    <span className="label">Member Since</span>
                                    <span className="value">{user.joined}</span>
                                </div>
                                <div className="edit-actions">
                                    <button type="submit" className="btn save-btn">Save Changes</button>
                                    <button type="button" className="btn cancel-btn" onClick={() => setIsEditingDetails(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="details-card">
                                <div className="detail-item">
                                    <span className="label">Full Name</span>
                                    <span className="value">{user.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Email Address</span>
                                    <span className="value">{user.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Phone Number</span>
                                    <span className="value">{user.phone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Member Since</span>
                                    <span className="value">{user.joined}</span>
                                </div>
                                <button className="btn edit-btn" onClick={() => setIsEditingDetails(true)}>Edit Details</button>
                            </div>
                        )}
                    </div>
                );

            case 'reports':
                return (
                    <div className="profile-section fade-in">
                        <div className="section-header">
                            <h2>My Reports</h2>
                        </div>
                        <div className="post-grid">
                            {mockReports.length > 0 ? (
                                mockReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="post-grid-item"
                                        onClick={() => navigate('/track', { state: { trackingId: report.id } })}
                                    >
                                        <img src={report.image} alt={report.name} />
                                        <div className="post-overlay" style={{ flexDirection: 'column', color: 'white' }}>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{report.name}</h3>
                                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>ID: {report.id}</span>
                                            <span style={{ fontSize: '0.8rem', marginTop: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px' }}>Click to Track</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">You haven't reported any stray pets yet.</p>
                            )}
                        </div>
                    </div>
                );

            case 'posts':
                return (
                    <div className="profile-section fade-in">
                        <div className="section-header">
                            <h2>Manage Posts</h2>
                            <button className="create-post-btn inline-btn" onClick={handleOpenCreateModal}>
                                <span className="plus-icon">+</span> Create a Post
                            </button>
                        </div>
                        <div className="post-grid">
                            {mockPosts.length > 0 ? (
                                mockPosts.map((post) => (
                                    <div key={post.id} className="post-grid-item">
                                        <img src={post.image} alt="Post" />
                                        <div className="post-overlay">
                                            <button className="icon-btn edit" onClick={() => alert('Edit Post (Mock)')}>✎</button>
                                            <button className="icon-btn delete" onClick={() => handleDeletePost(post.id)}>🗑</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">You haven't made any posts yet.</p>
                            )}
                        </div>
                    </div>
                );
            case 'donations':
                return (
                    <div className="profile-section fade-in">
                        <h2>Donations & Autopays</h2>
                        <div className="list-container">
                            {mockDonations.length > 0 ? (
                                mockDonations.map((donation) => (
                                    <div key={donation.id} className="list-item donation-item">
                                        <div className="item-info">
                                            <h3>{donation.to}</h3>
                                            <span className="date">{donation.date} • {donation.type}</span>
                                        </div>
                                        <div className="item-amount">
                                            <span className="amount">{donation.amount}</span>
                                            {donation.type.includes('Autopay') && (
                                                <button className="btn-small cancel-btn" onClick={() => handleCancelDonation(donation.id)}>Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No donation history found.</p>
                            )}
                        </div>
                    </div>
                );
            case 'documents':
                return (
                    <div className="profile-section fade-in">
                        <h2>Pet Documents</h2>
                        <div className="list-container grid-list">
                            {mockDocuments.length > 0 ? (
                                mockDocuments.map((doc) => (
                                    <div key={doc.id} className="document-card">
                                        <div className="doc-icon">📄</div>
                                        <div className="doc-info">
                                            <h4>{doc.name}</h4>
                                            <span className="doc-meta">{doc.type} • {doc.dateAdded}</span>
                                        </div>
                                        <div className="doc-actions">
                                            <button className="icon-btn download" onClick={() => handleDownloadDocument(doc.name)}>⬇</button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteDocument(doc.id)}>🗑</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No documents uploaded.</p>
                            )}
                        </div>
                        <div className="upload-area" onClick={handleMockUpload}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <p>Drag & drop files here, or click to select</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">

                {/* Sidebar */}
                <div className="profile-sidebar">
                    <div className="user-info-header">
                        <img src={user.avatar} alt="User Avatar" className="avatar" />
                        <h2 className="user-name">{user.name}</h2>
                        <p className="user-email">{user.email}</p>
                    </div>

                    <nav className="profile-nav">
                        <button
                            className={`nav-btn ${activeTab === 'personal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('personal')}
                        >
                            <span className="icon">👤</span> Personal Details
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <span className="icon">📝</span> Manage Posts
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            <span className="icon">📋</span> My Reports
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'donations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('donations')}
                        >
                            <span className="icon">💳</span> Donations & Autopays
                        </button>
                        <button
                            className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            <span className="icon">📁</span> Pet Documents
                        </button>
                    </nav>

                    <div className="sidebar-footer">
                        <button className="logout-btn" onClick={logout}>Sign Out</button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="profile-content">
                    {renderContent()}
                </div>

            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreatePostSubmit}
            />
        </div>
    );
};

export default Profile;
