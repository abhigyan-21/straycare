import React, { useState } from 'react';
import '../styles/Profile.css';
import '../styles/Post.css'; // For create-post-btn styles
import CreatePostModal from '../components/CreatePostModal';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [mockPosts, setMockPosts] = useState([
        { id: 1, image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600' },
        { id: 2, image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600' },
        { id: 3, image: 'https://images.unsplash.com/photo-1537151608804-ea6f11ccfb76?auto=format&fit=crop&q=80&w=600' },
        { id: 4, image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600' }
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

    const user = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91 77887 87665',
        joined: 'January 2026',
        avatar: 'https://i.pravatar.cc/150?img=11',
    };



    const mockDonations = [
        { id: 1, amount: '$50', date: '2026-03-01', type: 'One-time', to: 'StrayCare General Fund' },
        { id: 2, amount: '$20', date: '2026-02-15', type: 'Monthly Autopay', to: 'Medical Fund' },
    ];

    const mockDocuments = [
        { id: 1, name: 'Luna_Vaccination_Record.pdf', dateAdded: '2026-02-20', type: 'Medical' },
        { id: 2, name: 'Adoption_Certificate.pdf', dateAdded: '2026-01-15', type: 'Legal' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <div className="profile-section fade-in">
                        <h2>Personal Details</h2>
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
                            <button className="btn edit-btn">Edit Details</button>
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
                                            <button className="icon-btn edit">✎</button>
                                            <button className="icon-btn delete">🗑</button>
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
                                                <button className="btn-small cancel-btn">Cancel</button>
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
                                            <button className="icon-btn download">⬇</button>
                                            <button className="icon-btn delete">🗑</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No documents uploaded.</p>
                            )}
                        </div>
                        <div className="upload-area">
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
                        <button className="logout-btn">Sign Out</button>
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
