import { Edit3, Trash2, ShieldAlert } from 'lucide-react';

const mockPosts = [
    { id: 1, author: 'Jane Smith', content: 'Found a stray dog near Central Park...', date: '2 hours ago', status: 'Published' },
    { id: 2, author: 'John Doe', content: 'Here are some tips for fostering cats...', date: '5 hours ago', status: 'Published' },
    { id: 3, author: 'SpamBot', content: 'Click here for free dog food!!!', date: '1 day ago', status: 'Reported' }
];

const AdminContent = () => {
    return (
        <div>
            <div className="admin-mb-24">
                <h2 className="admin-page-title">Content & Posts Management</h2>
                <p className="admin-page-subtitle">Moderate community posts and update website content.</p>
            </div>

            <div className="admin-card">
                <h3 className="admin-card-title">Site Content Settings</h3>
                <p className="admin-card-subtitle">These settings control the text displayed on the main landing pages.</p>
                <button className="admin-btn-action primary-flex">
                    <Edit3 size={18} /> Edit 'About Us' Copy
                </button>
            </div>

            <div>
                <h3 className="admin-section-title">Community Posts Flagged / Recent</h3>
                <div className="admin-flex-col">
                    {mockPosts.map(post => (
                        <div key={post.id} className={`admin-list-item ${post.status === 'Reported' ? 'danger-border' : ''}`}>
                            <div>
                                <div className="admin-post-header">
                                    <span className="admin-post-author">{post.author}</span>
                                    <span className="admin-post-date">{post.date}</span>
                                    {post.status === 'Reported' && (
                                        <span className="admin-badge rounded admin-btn-action danger">
                                            <ShieldAlert size={12} /> Reported
                                        </span>
                                    )}
                                </div>
                                <p className="admin-post-content">"{post.content}"</p>
                            </div>
                            <div className="admin-flex-row">
                                <button className="admin-btn-action danger-flex" title="Delete Post">
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
