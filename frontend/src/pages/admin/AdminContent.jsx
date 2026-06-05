import { ShieldAlert, Trash2, CheckCircle, AlertTriangle, MessageSquare, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminBadge from '../../components/admin/AdminBadge';
import { getAdminPosts, updateAdminPostStatus, deleteAdminPost } from '../../services/api';

const AdminContent = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getAdminPosts();
                setPosts(data);
            } catch (error) {
                console.error("Error fetching posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handleAction = async (id, action) => {
        if (action === 'delete') {
            if (window.confirm("Permanently delete this post?")) {
                try {
                    await deleteAdminPost(id);
                    setPosts(posts.filter(p => p.id !== id));
                } catch (error) {
                    console.error("Error deleting post:", error);
                    alert("Error deleting post: " + (error.response?.data?.error || error.message));
                }
            }
        } else {
            const nextStatus = action === 'approve' ? 'Published' : 'Flagged';
            try {
                await updateAdminPostStatus(id, nextStatus);
                setPosts(posts.map(p => p.id === id ? { ...p, status: nextStatus } : p));
            } catch (error) {
                console.error("Error updating post status:", error);
                alert("Error updating post status: " + (error.response?.data?.error || error.message));
            }
        }
    };

    const filteredPosts = posts.filter(post => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'reported') return post.status === 'Reported' || post.status === 'Pending' || post.reports > 0;
        return post.status.toLowerCase() === activeFilter.toLowerCase();
    });

    if (loading) return <div className="admin-loading">Loading Posts...</div>;

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
