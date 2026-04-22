import React from 'react';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';

const PostCard = ({ post, onLike, onShare, onCommentChange, onSubmitComment, newComment }) => {
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
                    <img src={post.userImage} alt="User profile" className="post-user-img" />
                    <div className="post-user-info">
                        <span className="post-username">{post.username}</span>
                        <div className="post-meta-line">
                            {post.location && (
                                <span className="post-location">
                                    <MapPin size={12} className="meta-icon" /> {post.location}
                                </span>
                            )}
                            <span className="post-time">{post.timestamp}</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="post-content-scroll">
                    <div className="post-caption-block">
                        <img src={post.userImage} alt="User profile" className="post-user-img-small" />
                        <div className="caption-text">
                            <span className="post-username">{post.username}</span>
                            {' '}
                            {post.caption}
                        </div>
                    </div>

                    <div className="post-comments">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="comment">
                                <span className="comment-username">{comment.username}</span>
                                <span className="comment-text">{comment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interaction Footer */}
                <div className="post-footer">
                    <div className="post-actions">
                        <button
                            className={`post-action-btn like-btn ${post.isLiked ? 'liked' : ''}`}
                            onClick={() => onLike(post.id)}
                            title="Like"
                        >
                            <Heart 
                                size={22} 
                                color={post.isLiked ? "#ed4956" : "#262626"} 
                                fill={post.isLiked ? "#ed4956" : "none"} 
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
                        <strong>{post.likes.toLocaleString()} likes</strong>
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
