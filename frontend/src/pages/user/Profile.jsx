import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    FileText,
    ClipboardList,
    CreditCard,
    Folder,
    PawPrint,
    LifeBuoy,
    LogOut,
    Edit2,
    Trash2,
    Download,
    Star,
    MoreVertical
} from 'lucide-react';
import '../../styles/user/Profile.css';
import '../../styles/user/Post.css'; // For create-post-btn styles
import CreatePostModal from '../../components/user/CreatePostModal';
import { useAuthStore } from '../../store/authStore';
import MiniLoader from '../../components/user/MiniLoader';
import apiClient, { requestRescuerUpgradeOtp, verifyRescuerUpgradeOtp } from '../../services/api';
import { useProfileStore } from '../../store/profileStore';
import { processPDF } from '../../utils/pdfUtils';

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'><rect width='100%25' height='100%25' fill='%23f1f5f9'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

// Sub-component to reverse geocode lat/lng to readable address
const ReportAddress = ({ lat, lng }) => {
    const [address, setAddress] = useState('Fetching address...');

    useEffect(() => {
        if (!lat || !lng) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAddress('No location coordinates');
            return;
        }

        let active = true;
        const fetchAddress = async () => {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                const data = await response.json();
                if (active) {
                    const formatted = `${data.locality || data.city || 'Unknown Location'}, ${data.principalSubdivision || data.countryName}`;
                    setAddress(formatted);
                }
            } catch {
                if (active) {
                    setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
                }
            }
        };
        fetchAddress();
        return () => {
            active = false;
        };
    }, [lat, lng]);

    return <>{address}</>;
};

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const avatarInputRef = useRef(null);

    const { user: authUser, logout, updateProfileAction } = useAuthStore();
    const profileStore = useProfileStore();
    const {
        posts,
        reports,
        donations,
        subscriptions,
        documents,
        adoptions,
        rescues,
        loading: isLoadingData,
        fetchProfileData,
        addPost,
        editPost,
        deletePost,
        addDocument,
        deleteDocument,
        cancelSubscription,
    } = profileStore;

    const [activeTab, setActiveTab] = useState('personal');
    const [adoptionSubTab, setAdoptionSubTab] = useState('interested');
    const [rescueSubTab, setRescueSubTab] = useState('active');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [pdfStatus, setPdfStatus] = useState(''); // live compression status message
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessingPDF, setIsProcessingPDF] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [upgradeOtp, setUpgradeOtp] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showRescuerMenu, setShowRescuerMenu] = useState(false);

    const handleRequestUpgradeOtp = async () => {
        setIsUpgrading(true);
        try {
            await requestRescuerUpgradeOtp();
            setIsOtpSent(true);
            alert('OTP sent to your email.');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to request OTP');
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleVerifyUpgradeOtp = async () => {
        setIsUpgrading(true);
        try {
            const data = await verifyRescuerUpgradeOtp(upgradeOtp);
            const state = JSON.parse(localStorage.getItem('straycare_user'));
            if (state) {
                state.state.token = data.token;
                state.state.user = data.user;
                localStorage.setItem('straycare_user', JSON.stringify(state));
            }
            alert('Role upgraded successfully to RESCUER!');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to verify OTP');
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleLeaveRescuerRole = async () => {
        if (!window.confirm("Are you sure you want to leave the rescuer role? You will lose access to rescuer features and assigned rescues.")) return;
        try {
            await apiClient.post('/users/leave-rescuer-role');
            const state = JSON.parse(localStorage.getItem('straycare_user'));
            if (state && state.state && state.state.user) {
                state.state.user.role = 'USER';
                localStorage.setItem('straycare_user', JSON.stringify(state));
            }
            alert('You have successfully left the rescuer role.');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to leave rescuer role');
        }
    };

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

    const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                await updateProfileAction(undefined, undefined, undefined, compressedBase64);
                alert('Profile picture updated successfully!');
            } catch (err) {
                alert(err.message || 'Failed to update profile picture');
            }
        }
    };

    // Profile data (posts, reports, etc.) is read from profileStore

    useEffect(() => {
        if (authUser) {
            fetchProfileData(authUser);
        }
    }, [authUser, fetchProfileData]);

    const handleOpenCreateModal = (post = null) => {
        setPostToEdit(post);
        setIsCreateModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setPostToEdit(null);
        document.body.style.overflow = 'auto';
    };

    const handleCreatePostSubmit = async (newPost) => {
        if (newPost.id) {
            // Edit submission — delegate to profileStore
            try {
                const response = await apiClient.patch(`/feed/${newPost.id}`, { caption: newPost.caption });
                editPost(newPost.id, response.data.caption || newPost.caption);
            } catch (err) {
                console.warn('Backend failed to update post, applying local update.', err);
                editPost(newPost.id, newPost.caption);
            }
            return;
        }

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
                image: p.postImage || newPost.postImage,
                caption: p.caption,
                likes: p._count?.likes || 0,
                createdAt: p.createdAt,
            };
            addPost(createdPost);
        } catch (err) {
            console.warn('Backend failed to create post, falling back to mock upload.', err);
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10 + 2;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        addPost({ id: newPost.id, image: newPost.postImage, caption: newPost.caption });
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
            await deletePost(id); // profileStore handles API + optimistic update
        }
    };

    const handleCancelDonation = async (id) => {
        if (window.confirm('Are you sure you want to cancel this autopay?')) {
            await cancelSubscription(id); // profileStore handles API + optimistic update
        }
    };

    const handleDeleteDocument = async (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            await deleteDocument(id); // profileStore handles API + optimistic update
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
        if (!file) return;

        setPdfStatus('');
        setUploadProgress(0);
        e.target.value = null; // allow re-selecting same file
        setIsProcessingPDF(true);

        let result;
        try {
            // processPDF sets status: "Uploading..."
            result = await processPDF(file, (status) => setPdfStatus(status));
        } catch (err) {
            // > 2 MB rejection
            alert(err.message);
            setPdfStatus('');
            setIsProcessingPDF(false);
            return;
        }

        // Give the bar an initial bump so the user sees immediate action
        setUploadProgress(15);

        try {
            const response = await apiClient.post('/medical/documents', {
                name: file.name,
                type: 'Medical',
                fileData: result.base64
            }, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        // Hold at 95% until the server actually responds with success
                        setUploadProgress(Math.min(percentCompleted, 95));
                    }
                }
            });
            const d = response.data;
            addDocument({
                id: d.id,
                name: d.name,
                dateAdded: new Date(d.createdAt).toISOString().split('T')[0],
                type: d.type,
                fileData: d.fileData
            });
            setUploadProgress(100);
            setPdfStatus(`✓ Done — "${file.name}" saved`);

            // Clean up back to default state after 3 seconds
            setTimeout(() => {
                setPdfStatus('');
                setUploadProgress(0);
            }, 3000);
        } catch (err) {
            console.warn('Backend upload failed, using offline mode.', err);
            addDocument({
                id: Date.now(),
                name: file.name,
                dateAdded: new Date().toISOString().split('T')[0],
                type: 'Uploaded'
            });
            setUploadProgress(100);
            setPdfStatus(`✓ Done — "${file.name}" saved (offline mode)`);

            setTimeout(() => {
                setPdfStatus('');
                setUploadProgress(0);
            }, 3000);
        } finally {
            setIsProcessingPDF(false);
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
                                onClick={() => handleOpenCreateModal()}
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
                                            <button className="icon-btn edit" onClick={() => handleOpenCreateModal(post)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="icon-btn delete" onClick={() => handleDeletePost(post.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">You haven't made any posts yet.</p>
                            )}
                        </div>
                    </div>
                );
            case 'donations': {
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
            }
            case 'documents':
                return (
                    <div className="profile-section fade-in">
                        <h2>Pet Documents</h2>
                        <div className="list-container grid-list">
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <div key={doc.id} className="document-card">
                                        <div className="doc-icon">
                                            <FileText size={24} />
                                        </div>
                                        <div className="doc-info">
                                            <h4>{doc.name}</h4>
                                            <span className="doc-meta">{doc.type} • {doc.dateAdded}</span>
                                        </div>
                                        <div className="doc-actions">
                                            <button className="icon-btn download" onClick={() => handleDownloadDocument(doc.name, doc.fileData)}>
                                                <Download size={16} />
                                            </button>
                                            <button className="icon-btn delete" onClick={() => handleDeleteDocument(doc.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">No documents uploaded.</p>
                            )}
                        </div>
                        <div
                            className={`upload-area${isProcessingPDF ? ' uploading' : ''}`}
                            onClick={!isProcessingPDF && !pdfStatus ? handleMockUpload : undefined}
                            style={{
                                cursor: isProcessingPDF || pdfStatus ? 'default' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                borderColor: pdfStatus.startsWith('✓') ? '#27ae60' : undefined
                            }}
                        >
                            {/* Animated background progress fill */}
                            {(isProcessingPDF || pdfStatus) && !pdfStatus.startsWith('✓') && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    width: `${uploadProgress}%`,
                                    background: 'rgba(243, 156, 18, 0.15)', // light orange fill
                                    transition: 'width 0.2s ease',
                                    zIndex: 0
                                }} />
                            )}

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <input
                                    type="file"
                                    accept="application/pdf, .pdf"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />

                                {pdfStatus ? (
                                    <p style={{
                                        fontWeight: 600,
                                        color: pdfStatus.startsWith('✓') ? '#27ae60' : '#f39c12',
                                        margin: 0
                                    }}>
                                        {pdfStatus.startsWith('✓') ? pdfStatus : `Uploading... ${uploadProgress}%`}
                                    </p>
                                ) : (
                                    <>
                                        <p style={{ margin: '0 0 8px 0' }}>Drag & drop PDF here, or click to select</p>
                                        <small style={{ color: '#888', fontSize: '0.75rem' }}>Max 2 MB • PDF files only</small>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'adoptions': {
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
            }
            case 'rescues': {
                const filteredRescues = rescues.filter(r =>
                    rescueSubTab === 'active'
                        ? (r.status === 'ASSIGNED')
                        : (r.status === 'RESCUED' || r.status === 'TREATED' || r.status === 'ADOPTED')
                );

                return (
                    <div className="profile-section fade-in">
                        <div className="profile-section-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h2>My Rescues</h2>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="sub-tab-toggle">
                                    <button
                                        className={`sub-tab-btn ${rescueSubTab === 'active' ? 'active' : ''}`}
                                        onClick={() => setRescueSubTab('active')}
                                    >
                                        Active Rescues
                                    </button>
                                    <button
                                        className={`sub-tab-btn ${rescueSubTab === 'completed' ? 'active' : ''}`}
                                        onClick={() => setRescueSubTab('completed')}
                                    >
                                        Completed Rescues
                                    </button>
                                </div>
                                {authUser?.role === 'RESCUER' && (
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <button 
                                            onClick={() => setShowRescuerMenu(!showRescuerMenu)}
                                            style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '50%' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {showRescuerMenu && (
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: '100%', 
                                                right: 0, 
                                                marginTop: '5px', 
                                                background: 'white', 
                                                border: '1px solid #ddd', 
                                                borderRadius: '8px', 
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                                                zIndex: 10,
                                                minWidth: '150px',
                                                overflow: 'hidden'
                                            }}>
                                                <button 
                                                    onClick={() => {
                                                        setShowRescuerMenu(false);
                                                        handleLeaveRescuerRole();
                                                    }}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '12px 16px', 
                                                        background: 'none', 
                                                        border: 'none', 
                                                        textAlign: 'left', 
                                                        color: '#ff4d4f', 
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        display: 'block'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#fff1f0'}
                                                    onMouseLeave={(e) => e.target.style.background = 'none'}
                                                >
                                                    Leave Role
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="adoption-list">
                            {filteredRescues.length > 0 ? (
                                filteredRescues.map((item) => (
                                    <div key={item.id} className="adoption-card">
                                        <div className="adoption-pet-img">
                                            <img src={item.image} alt="Rescued Stray" />
                                        </div>
                                        <div className="adoption-card-info">
                                            <div className="adoption-card-main">
                                                <h3>{item.description}</h3>
                                                <p className="pet-breed" style={{ margin: '4px 0 8px 0' }}>
                                                    <strong>Reporter:</strong> {item.reporterName} ({item.reporterPhone})
                                                </p>
                                                <p className="clinic-info">
                                                    <strong>Location:</strong> <ReportAddress lat={item.lat} lng={item.lng} />
                                                </p>
                                            </div>
                                            <div className="adoption-card-status">
                                                <span className={`status-badge ${item.status.toLowerCase()}`}>
                                                    {item.status === 'RESCUED' ? 'Reached Clinic' : item.status}
                                                </span>
                                                <span className="adoption-date">Reported: {item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">
                                    {rescueSubTab === 'active'
                                        ? "No active rescues assigned to you."
                                        : "No completed rescues found."}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }
            case 'upgrade':
                return (
                    <div className="profile-section fade-in">
                        <div className="profile-section-header">
                            <h2>Become a Rescuer</h2>
                        </div>
                        <div className="details-card" style={{ padding: '24px', textAlign: 'center' }}>
                            <Star size={48} color="#e0645c" style={{ marginBottom: '16px' }} />
                            <h3>Ready to make a bigger impact?</h3>
                            <p style={{ color: '#666', marginTop: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
                                Upgrade your account to a RESCUER. As a rescuer, you can actively pick up stray animals in distress, transport them to our partner clinics, and track their recovery progress. You will receive an OTP on your registered email to verify this upgrade.
                            </p>
                            {!isOtpSent ? (
                                <button
                                    className="btn save-btn"
                                    style={{ padding: '12px 24px', fontSize: '1rem' }}
                                    onClick={handleRequestUpgradeOtp}
                                    disabled={isUpgrading}
                                >
                                    {isUpgrading ? 'Sending...' : 'Request OTP to Upgrade'}
                                </button>
                            ) : (
                                <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={upgradeOtp}
                                        onChange={(e) => setUpgradeOtp(e.target.value)}
                                        className="edit-input"
                                        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', marginBottom: '16px' }}
                                    />
                                    <button
                                        className="btn save-btn"
                                        style={{ padding: '12px 24px', fontSize: '1rem', width: '100%' }}
                                        onClick={handleVerifyUpgradeOtp}
                                        disabled={isUpgrading}
                                    >
                                        {isUpgrading ? 'Verifying...' : 'Verify OTP & Upgrade'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Helmet>
                <title>Furzo - My Profile</title>
                <meta name="description" content="Manage your Furzo profile, view your rescue reports, adoption history, posts, donations, and pet documents." />
            </Helmet>
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
                                <UserIcon className="icon" size={18} /> Personal Details
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('posts')}
                            >
                                <FileText className="icon" size={18} /> Manage Posts
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
                                onClick={() => setActiveTab('reports')}
                            >
                                <ClipboardList className="icon" size={18} /> My Reports
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'donations' ? 'active' : ''}`}
                                onClick={() => setActiveTab('donations')}
                            >
                                <CreditCard className="icon" size={18} /> Donations & Autopays
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'documents' ? 'active' : ''}`}
                                onClick={() => setActiveTab('documents')}
                            >
                                <Folder className="icon" size={18} /> Pet Documents
                            </button>
                            <button
                                className={`nav-btn ${activeTab === 'adoptions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('adoptions')}
                            >
                                <PawPrint className="icon" size={18} /> Adoptions
                            </button>
                            {authUser?.role === 'RESCUER' && (
                                <button
                                    className={`nav-btn ${activeTab === 'rescues' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('rescues')}
                                >
                                    <LifeBuoy className="icon" size={18} /> Rescues
                                </button>
                            )}
                            {authUser?.role === 'USER' && (
                                <button
                                    className={`nav-btn ${activeTab === 'upgrade' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('upgrade')}
                                >
                                    <Star className="icon" size={18} /> Become a Rescuer
                                </button>
                            )}
                        </nav>

                        <div className="sidebar-footer">
                            <button className="logout-btn" onClick={logout}>
                                <LogOut className="icon" size={18} /> Sign Out
                            </button>
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
                    initialPost={postToEdit}
                />
            </div>
        </>
    );
};

export default Profile;

