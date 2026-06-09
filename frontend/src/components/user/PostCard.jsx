import React from 'react';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';

const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const PostCard = ({ post, currentUserId, onLike, onShare, onCommentChange, onSubmitComment, newComment }) => {
    const isLiked = post.likes?.some(like => like.userId === currentUserId);
    const likeCount = post.likes?.length || 0;
    const authorName = post.author?.name || 'Unknown User';
    const authorImage = post.author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';

    return (
        <div className="post-card">
            {/* Left Side: Image */}
            <div className="post-image-section">
                <img src={post.postImage} alt="Post content" className="post-main-image" />
            </div>

            {/* Right Side: Details */}
            <div className="post-details-section">
                {/* Header: User Info */}
                <div className="post-header">
                    <img src={authorImage} alt="User profile" className="post-user-img" />
                    <div className="post-user-info">
                        <span className="post-username">{authorName}</span>
                        <div className="post-meta-line">
                            {post.location && (
                                <span className="post-location">
                                    <MapPin size={12} className="meta-icon" /> {post.location}
                                </span>
                            )}
                            <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="post-content-scroll">
                    <div className="post-caption-block">
                        <img src={authorImage} alt="User profile" className="post-user-img-small" />
                        <div className="caption-text">
                            <span className="post-username">{authorName}</span>
                            {' '}
                            {post.caption}
                        </div>
                    </div>

                    <div className="post-comments">
                        {post.comments?.map(comment => (
                            <div key={comment.id} className="comment">
                                <span className="comment-username">{comment.user?.name || 'Unknown'}</span>
                                <span className="comment-text">{comment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interaction Footer */}
                <div className="post-footer">
                    <div className="post-actions">
                        <button
                            className={`post-action-btn like-btn ${isLiked ? 'liked' : ''}`}
                            onClick={() => onLike(post.id)}
                            title="Like"
                        >
                            <Heart 
                                size={22} 
                                color={isLiked ? "#ed4956" : "#262626"} 
                                fill={isLiked ? "#ed4956" : "none"} 
                                strokeWidth={2.5}
                            />
                        </button>
                        <button className="post-action-btn comment-btn" title="Comment">
                            <MessageCircle size={22} color="#262626" strokeWidth={2.5} />
                        </button>
                        <button className="post-action-btn share-btn" onClick={() => onShare(post)} title="Share">
                            <Share2 size={22} color="#262626" strokeWidth={2.5} />
                        </button>
                    </div>
                    <div className="post-likes-count">
                        <strong>{likeCount.toLocaleString()} likes</strong>
                    </div>

                    <div className="post-add-comment">
                        <form onSubmit={(e) => onSubmitComment(e, post.id)}>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment || ''}
                                onChange={(e) => onCommentChange(post.id, e.target.value)}
                            />
                            <button
                                type="submit"
                                className="post-btn"
                                disabled={!newComment || newComment.trim() === ''}
                            >
                                Post
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;

