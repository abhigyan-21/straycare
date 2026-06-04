import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/Profile.css';
import '../../styles/user/Post.css'; // For create-post-btn styles
import CreatePostModal from '../../components/user/CreatePostModal';
import { useAuthStore } from '../../store/authStore';
import MiniLoader from '../../components/user/MiniLoader';
import apiClient from '../../services/api';

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'><rect width='100%25' height='100%25' fill='%23f1f5f9'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const avatarInputRef = useRef(null);

    const { user: authUser, logout, updateProfileAction } = useAuthStore();
    const [activeTab, setActiveTab] = useState('personal');
    const [adoptionSubTab, setAdoptionSubTab] = useState('interested'); // 'interested' or 'adopted'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [user, setUser] = useState({
        name: '',
        email: '',
        phone: '',
        joined: '',
        avatar: '',
    });

    useEffect(() => {
        if (!authUser) {
            navigate('/');
            return;
        }

        setUser({
            name: authUser.name || 'John Doe',
            email: authUser.email || 'john.doe@example.com',
            phone: authUser.phone || authUser.contact || '+91 77887 87665',
            joined: authUser.createdAt 
                ? new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                : 'January 2026',
            avatar: authUser.avatarUrl || defaultAvatar,
        });
    }, [authUser, navigate]);

    const handleAvatarClick = () => {
        avatarInputRef.current.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result;
                try {
                    await updateProfileAction(undefined, undefined, undefined, base64Image);
                } catch (err) {
                    alert(err.message || 'Failed to update profile picture');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const [posts, setPosts] = useState([]);
    const [reports, setReports] = useState([]);
    const [donations, setDonations] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [adoptions, setAdoptions] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const fetchProfileData = async () => {
        setIsLoadingData(true);
        try {
            const [postsRes, reportsRes, donationsRes, docsRes, adoptionsRes] = await Promise.all([
                apiClient.get('/feed/my-posts').catch(() => ({ data: null })),
                apiClient.get('/reports/my-reports').catch(() => ({ data: null })),
                apiClient.get('/funding/my-donations').catch(() => ({ data: null })),
                apiClient.get('/medical/documents').catch(() => ({ data: null })),
                apiClient.get('/adoptions/requests').catch(() => ({ data: null }))
            ]);

            if (postsRes && postsRes.data) {
                const mappedPosts = postsRes.data.map(p => ({
                    id: p.id,
                    image: p.mediaUrls[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600',
                    caption: p.content,
                    likes: p.likesCount,
                    createdAt: p.createdAt
                }));
                setPosts(mappedPosts);
            } else {
                setPosts([]);
            }

            if (reportsRes && reportsRes.data) {
                const mappedReports = reportsRes.data.map(r => ({
                    id: r.id.substring(0, 8),
                    actualId: r.id,
                    image: r.mediaUrls[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                    name: r.description.length > 25 ? r.description.substring(0, 25) + '...' : r.description,
                    location: `Lat: ${r.locationLat.toFixed(2)}, Lng: ${r.locationLng.toFixed(2)}`,
                    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }));
                setReports(mappedReports);
            } else {
                setReports([]);
            }

            if (donationsRes && donationsRes.data && donationsRes.data.status === 'success') {
                const mappedDonations = donationsRes.data.donations.map(d => ({
                    id: d.id,
                    amount: `₹${d.amount}`,
                    date: new Date(d.createdAt).toISOString().split('T')[0],
                    type: d.type === 'CAMPAIGN' ? 'Campaign Donation' : `${d.type} Donation`,
                    to: d.campaign?.title || d.clinic?.name || 'StrayCare General Fund'
                }));
                setDonations(mappedDonations);

                const mappedSubscriptions = donationsRes.data.subscriptions.map(s => ({
                    id: s.id,
                    amount: `₹${s.amount}`,
                    date: new Date(s.createdAt).toISOString().split('T')[0],
                    type: 'Monthly Autopay',
                    to: s.clinic?.name || 'Clinic Partner',
                    status: s.status
                }));
                setSubscriptions(mappedSubscriptions);
            } else {
                setDonations([]);
                setSubscriptions([]);
            }

            if (docsRes && docsRes.data) {
                const mappedDocs = docsRes.data.map(d => ({
                    id: d.id,
                    name: d.name,
                    dateAdded: new Date(d.createdAt).toISOString().split('T')[0],
                    type: d.type,
                    fileData: d.fileData
                }));
                setDocuments(mappedDocs);
            } else {
                setDocuments([]);
            }

            if (adoptionsRes && adoptionsRes.data && adoptionsRes.data.status === 'success') {
                const mappedAdoptions = adoptionsRes.data.data.map(a => {
                    let statusText = 'Pending Review';
                    let statusType = 'pending';
                    if (a.status === 'INTERVIEW_SCHEDULED') {
                        statusText = 'Interview Scheduled';
                        statusType = 'interview';
                    } else if (a.status === 'APPROVED') {
                        statusText = 'Successfully Adopted';
                        statusType = 'adopted';
                    } else if (a.status === 'REJECTED') {
                        statusText = 'Rejected';
                        statusType = 'rejected';
                    }

                    return {
                        id: a.id,
                        petName: a.pet.name || 'Stray Pet',
                        petBreed: a.pet.breed || 'Mixed',
                        petImage: a.pet.report?.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=500',
                        status: statusText,
                        statusType: statusType,
                        date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        clinic: a.pet.clinic?.name || 'StrayCare Center'
                    };
                });
                setAdoptions(mappedAdoptions);
            } else {
                setAdoptions([]);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            setPosts([]);
            setReports([]);
            setDonations([]);
            setSubscriptions([]);
            setDocuments([]);
            setAdoptions([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (authUser) {
            fetchProfileData();
        }
    }, [authUser]);

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        document.body.style.overflow = 'auto';
    };

    const handleCreatePostSubmit = async (newPost) => {
        handleCloseCreateModal();
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await apiClient.post('/feed', {
                content: newPost.caption,
                mediaUrls: [newPost.postImage]
            });

            const p = response.data;
            const createdPost = {
                id: p.id,
                image: p.mediaUrls[0] || newPost.postImage,
                caption: p.content,
                likes: p.likesCount,
                createdAt: p.createdAt
            };
            setPosts([createdPost, ...posts]);
        } catch (err) {
            console.warn('Backend failed to create post, falling back to mock upload.', err);
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10 + 2;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        setPosts([{ id: newPost.id, image: newPost.postImage, caption: newPost.caption }, ...posts]);
                        setIsUploading(false);
                        setUploadProgress(0);
                    }, 800);
                }
                setUploadProgress(progress);
            }, 400);
            return;
        }
        setIsUploading(false);
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const phone = formData.get('phone');

        try {
            await updateProfileAction(name, email, phone);
            setIsEditingDetails(false);
        } catch (err) {
            alert(err.message || 'Failed to update details');
        }
    };

    const handleDeletePost = async (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await apiClient.delete(`/feed/${id}`);
                setPosts(posts.filter(post => post.id !== id));
            } catch (err) {
                console.warn('Backend failed to delete post, falling back to local deletion.', err);
                setPosts(posts.filter(post => post.id !== id));
            }
        }
    };

    const handleCancelDonation = async (id) => {
        if (window.confirm('Are you sure you want to cancel this autopay?')) {
            try {
                await apiClient.post(`/funding/subscriptions/${id}/cancel`);
                setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: 'CANCELLED' } : s));
            } catch (err) {
                console.warn('Backend failed to cancel subscription, falling back to local deletion.', err);
                setSubscriptions(subscriptions.filter(d => d.id !== id));
            }
        }
    };

    const handleDeleteDocument = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await apiClient.delete(`/medical/documents/${id}`);
                setDocuments(documents.filter(doc => doc.id !== id));
            } catch (err) {
                console.warn('Backend failed to delete document, falling back to local deletion.', err);
                setDocuments(documents.filter(doc => doc.id !== id));
            }
        }
    };

    const handleDownloadDocument = (name, fileData) => {
        if (fileData) {
            const link = document.createElement('a');
            link.href = fileData;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`Downloading ${name}... (Mock Mode)`);
        }
    };

    const handleMockUpload = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Content = reader.result;
                try {
                    const response = await apiClient.post('/medical/documents', {
                        name: file.name,
                        type: file.type.includes('pdf') ? 'Medical' : 'Other',
                        fileData: base64Content
                    });
                    const d = response.data;
                    const newDoc = {
                        id: d.id,
                        name: d.name,
                        dateAdded: new Date(d.createdAt).toISOString().split('T')[0],
                        type: d.type,
                        fileData: d.fileData
                    };
                    setDocuments([newDoc, ...documents]);
                    alert(`File "${file.name}" uploaded successfully!`);
                } catch (err) {
                    console.warn('Backend failed to upload document, falling back to mock upload.', err);
                    const newDoc = {
                        id: Date.now(),
                        name: file.name,
                        dateAdded: new Date().toISOString().split('T')[0],
                        type: 'Uploaded'
                    };
                    setDocuments([...documents, newDoc]);
                    alert(`File "${file.name}" uploaded successfully (offline mode)!`);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const renderContent = () => {
        if (isLoadingData) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <MiniLoader />
                </div>
            );
        }

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
                        <div className="profile-section-header">
                            <h2>My Reports</h2>
                        </div>
                        <div className="post-grid">
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="post-grid-item"
                                        onClick={() => navigate('/track', { state: { trackingId: report.actualId || report.id } })}
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
                        <div className="profile-section-header">
                            <h2>Manage Posts</h2>
                            <button 
                                className={`create-post-btn inline-btn ${isUploading ? 'uploading' : ''}`} 
                                onClick={handleOpenCreateModal}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <div className="button-progress-wrapper">
                                        <div 
                                            className="button-progress-fill" 
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                        <div className="button-progress-content">
                                            <MiniLoader />
                                            <span>Posting... {Math.round(uploadProgress)}%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="plus-icon">+</span> Create a Post
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="post-grid">
                            {posts.length > 0 ? (
                                posts.map((post) => (
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
                const allItems = [
                    ...donations.map(d => ({ ...d, isSubscription: false })),
                    ...subscriptions.map(s => ({ ...s, isSubscription: true }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                return (
                    <div className="profile-section fade-in">
                        <h2>Donations & Autopays</h2>
                        <div className="list-container">
                            {allItems.length > 0 ? (
                                allItems.map((item) => (
                                    <div key={item.id} className="list-item donation-item">
                                        <div className="item-info">
                                            <h3>{item.to}</h3>
                                            <span className="date">
                                                {item.date} • {item.type} {item.isSubscription && `(${item.status})`}
                                            </span>
                                        </div>
                                        <div className="item-amount">
                                            <span className="amount">{item.amount}</span>
                                            {item.isSubscription && item.status !== 'CANCELLED' && (
                                                <button className="btn-small cancel-btn" onClick={() => handleCancelDonation(item.id)}>Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No donation or autopay history found.</p>
                            )}
                        </div>
                    </div>
                );
            case 'documents':
                return (
                    <div className="profile-section fade-in">
                        <h2>Pet Documents</h2>
                        <div className="list-container grid-list">
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className="document-card">
                                        <div className="doc-icon">📄</div>
                                        <div className="doc-info">
                                            <h4>{doc.name}</h4>
                                            <span className="doc-meta">{doc.type} • {doc.dateAdded}</span>
                                        </div>
                                        <div className="doc-actions">
                                            <button className="icon-btn download" onClick={() => handleDownloadDocument(doc.name, doc.fileData)}>⬇</button>
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
            case 'adoptions':
                const filteredAdoptions = adoptions.filter(a =>
                    adoptionSubTab === 'interested' ? a.statusType !== 'adopted' : a.statusType === 'adopted'
                );

                return (
                    <div className="profile-section fade-in">
                        <div className="profile-section-header">
                            <h2>My Adoptions</h2>
                            <div className="sub-tab-toggle">
                                <button
                                    className={`sub-tab-btn ${adoptionSubTab === 'interested' ? 'active' : ''}`}
                                    onClick={() => setAdoptionSubTab('interested')}
                                >
                                    Interested in Adopting
                                </button>
                                <button
                                    className={`sub-tab-btn ${adoptionSubTab === 'adopted' ? 'active' : ''}`}
                                    onClick={() => setAdoptionSubTab('adopted')}
                                >
                                    Adopted
                                </button>
                            </div>
                        </div>

                        <div className="adoption-list">
                            {filteredAdoptions.length > 0 ? (
                                filteredAdoptions.map((item) => (
                                    <div key={item.id} className="adoption-card">
                                        <div className="adoption-pet-img">
                                            <img src={item.petImage} alt={item.petName} />
                                        </div>
                                        <div className="adoption-card-info">
                                            <div className="adoption-card-main">
                                                <h3>{item.petName}</h3>
                                                <span className="pet-breed">{item.petBreed}</span>
                                                <p className="clinic-info">Listed by: <strong>{item.clinic}</strong></p>
                                            </div>
                                            <div className="adoption-card-status">
                                                <span className={`status-badge ${item.statusType}`}>
                                                    {item.status}
                                                </span>
                                                <span className="adoption-date">{item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">
                                    {adoptionSubTab === 'interested' 
                                        ? "You haven't applied for any pets yet." 
                                        : "You haven't adopted any pets yet."}
                                </p>
                            )}
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
                        <div className="avatar-container" onClick={handleAvatarClick} title="Click to upload custom profile picture">
                            <img src={user.avatar} alt="User Avatar" className="avatar" />
                            <div className="avatar-overlay">
                                <span className="camera-icon">📷</span>
                            </div>
                            <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
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
                        <button
                            className={`nav-btn ${activeTab === 'adoptions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('adoptions')}
                        >
                            <span className="icon">🐾</span> Adoptions
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
