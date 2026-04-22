import { Edit3, Trash2, ShieldAlert, AlertTriangle, Eye } from 'lucide-react';
import { useState } from 'react';

const initialPosts = [
    { id: 1, author: 'Jane Smith', content: 'Found a stray dog near Central Park. Please share!', date: '2 hours ago', status: 'Published' },
    { id: 2, author: 'John Doe', content: 'Here are some tips for fostering cats in summer.', date: '5 hours ago', status: 'Published' },
    { id: 3, author: 'SpamBot', content: 'Click here for free dog food!!! Limited time offer!', date: '1 day ago', status: 'Reported' },
    { id: 4, author: 'Mike Ross', content: 'Aggressive dog spotted near the subway entrance.', date: '3 days ago', status: 'Pending' }
];

const AdminContent = () => {
    const [posts, setPosts] = useState(initialPosts);

    const deletePost = (id) => {
        if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
            setPosts(posts.filter(p => p.id !== id));
        }
    };

    const warnUser = (author) => {
        alert(`A warning notification has been sent to ${author} regarding their content.`);
    };

    return (
        <div>
            <div className="admin-flex-between admin-mb-24">
                <div>
                    <h2 className="admin-page-title">Content & Posts Management</h2>
                    <p className="admin-page-subtitle">Moderate community posts and update website content.</p>
                </div>
            </div>

            <div className="admin-card">
                <h3 className="admin-card-title">Site Content Settings</h3>
                <p className="admin-card-subtitle">These settings control the text displayed on the main landing pages.</p>
                <div className="admin-flex-row">
                    <button className="admin-btn-action primary-flex">
                        <Edit3 size={18} /> Edit 'About Us' Copy
                    </button>
                    <button className="admin-btn-action secondary">
                        <Eye size={18} /> Preview Landing Page
                    </button>
                </div>
            </div>

            <div>
                <h3 className="admin-section-title">Community Posts Moderation</h3>
                <div className="admin-flex-col">
                    {posts.map(post => (
                        <div key={post.id} className={`admin-list-item ${post.status === 'Reported' ? 'danger-border' : post.status === 'Pending' ? 'warning-border' : ''}`}>
                            <div style={{ flex: 1 }}>
                                <div className="admin-post-header">
                                    <span className="admin-post-author">{post.author}</span>
                                    <span className="admin-post-date">{post.date}</span>
                                    {post.status === 'Reported' && (
                                        <span className="admin-badge rounded admin-btn-action danger" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                            <ShieldAlert size={12} /> Reported
                                        </span>
                                    )}
                                    {post.status === 'Pending' && (
                                        <span className="admin-badge rounded admin-btn-action secondary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                            Pending Review
                                        </span>
                                    )}
                                </div>
                                <p className="admin-post-content">"{post.content}"</p>
                            </div>
                            <div className="admin-flex-row admin-mt-auto-mobile">
                                <button 
                                    className="admin-btn-action secondary" 
                                    title="Warn User"
                                    onClick={() => warnUser(post.author)}
                                >
                                    <AlertTriangle size={18} />
                                </button>
                                <button 
                                    className="admin-btn-action danger-flex" 
                                    title="Delete Post"
                                    onClick={() => deletePost(post.id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminContent;
