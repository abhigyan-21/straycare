import { ShieldAlert, Trash2, CheckCircle, AlertTriangle, MessageSquare, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { mockPosts } from '../../data/adminMockData';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminBadge from '../../components/admin/AdminBadge';

const AdminContent = () => {
    const [posts, setPosts] = useState(mockPosts);
    const [activeFilter, setActiveFilter] = useState('all');

    const handleAction = (id, action) => {
        if (action === 'delete') {
            if (window.confirm("Permanently delete this post?")) {
                setPosts(posts.filter(p => p.id !== id));
            }
        } else {
            setPosts(posts.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'Published' : 'Flagged' } : p));
        }
    };

    const filteredPosts = posts.filter(post => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'reported') return post.status === 'Reported' || post.reports > 0;
        return post.status.toLowerCase() === activeFilter.toLowerCase();
    });

    return (
        <div className="fade-in">
            <AdminPageHeader 
                title="Content Moderation" 
                subtitle="Review and moderate community posts to maintain a safe environment."
            />

            <div className="admin-mb-32 admin-tabs">
                <button className={`admin-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All Posts</button>
                <button className={`admin-tab ${activeFilter === 'reported' ? 'active' : ''}`} onClick={() => setActiveFilter('reported')}>Reported</button>
                <button className={`admin-tab ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => setActiveFilter('pending')}>Pending</button>
            </div>

            <div className="admin-moderation-list">
                {filteredPosts.map(post => (
                    <div key={post.id} className={`admin-post-card ${post.status === 'Reported' ? 'reported' : ''}`}>
                        <div className="admin-post-header">
                            <div className="admin-flex-row">
                                <img src={post.authorAvatar} alt={post.author} className="admin-avatar-small" />
                                <div>
                                    <h4 className="admin-author-name">{post.author}</h4>
                                    <span className="admin-post-time">{post.date}</span>
                                </div>
                            </div>
                            <div className="admin-flex-row">
                                {post.reports > 0 && (
                                    <AdminBadge color="red">
                                        <Flag size={12} /> {post.reports} Reports
                                    </AdminBadge>
                                )}
                                <AdminBadge color={post.status === 'Published' ? 'green' : post.status === 'Reported' ? 'red' : 'light'}>
                                    {post.status}
                                </AdminBadge>
                            </div>
                        </div>

                        <div className="admin-post-body">
                            <p>"{post.content}"</p>
                        </div>

                        <div className="admin-post-footer admin-flex-between">
                            <div className="admin-flex-row" style={{ color: 'var(--admin-text-light)', fontSize: '0.85rem' }}>
                                <MessageSquare size={16} /> 0 Comments
                            </div>
                            <div className="admin-flex-row">
                                {post.status !== 'Published' && (
                                    <button className="admin-btn-action green" onClick={() => handleAction(post.id, 'approve')}>
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                )}
                                <button className="admin-btn-action secondary" onClick={() => handleAction(post.id, 'flag')}>
                                    <AlertTriangle size={18} /> Flag
                                </button>
                                <button className="admin-btn-action danger-flex" onClick={() => handleAction(post.id, 'delete')}>
                                    <Trash2 size={18} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPosts.length === 0 && (
                    <div className="admin-card center" style={{ padding: '60px' }}>
                        <ShieldAlert size={48} color="var(--admin-accent)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3 className="admin-card-title">Everything is clean!</h3>
                        <p className="admin-page-subtitle">No posts match the current filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminContent;
