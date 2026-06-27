import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Flag, Trash2 } from 'lucide-react';

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

const PostCard = ({ post, currentUserId, onLike, onShare, onCommentChange, onSubmitComment, newComment, onReport, onDeleteComment }) => {
    const [showAllComments, setShowAllComments] = useState(false);
    const commentInputRef = useRef(null);
    const isLiked = post.likes?.some(like => like.userId === currentUserId);
    const likeCount = post.likes?.length || 0;
    const authorName = post.author?.name || 'Unknown User';
    const authorImage = post.author?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

    return (
        <div className="post-card">
            {/* Left Side: Image */}
            <div className="post-image-section">
                <img src={post.postImage} alt="Post content" className="post-main-image" loading="lazy" />
            </div>

            {/* Right Side: Details */}
            <div className="post-details-section">
                {/* Header: User Info */}
                <div className="post-header">
                    <img src={authorImage} alt="User profile" className="post-user-img" loading="lazy" />
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
                        <div className="caption-text" style={{ fontWeight: 'bold' }}>
                            {post.caption}
                        </div>
                    </div>

                    <div className="post-comments">
                        {(showAllComments ? post.comments : post.comments?.slice(0, 3))?.map(comment => {
                            const commenterName = comment.user?.name || 'Unknown';
                            const commenterImage = comment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(commenterName)}&background=random`;
                            return (
                                <div key={comment.id} className="comment" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                                        <img src={commenterImage} alt="User profile" className="post-user-img-small" loading="lazy" style={{ width: '24px', height: '24px', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle', borderRadius: '50%' }} />
                                        <div style={{ wordBreak: 'break-word', paddingRight: '8px' }}>
                                            <span className="comment-username" style={{ fontWeight: '600', marginRight: '4px' }}>{commenterName}</span>
                                            <span className="comment-text">{comment.text}</span>
                                        </div>
                                    </div>
                                    {comment.userId === currentUserId && (
                                        <button 
                                            onClick={() => onDeleteComment(post.id, comment.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: '2px', alignSelf: 'center' }}
                                            title="Delete Comment"
                                        >
                                            <Trash2 size={14} color="#ed4956" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {!showAllComments && post.comments?.length > 3 && (
                            <button
                                className="view-all-comments-btn"
                                onClick={() => setShowAllComments(true)}
                                style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', padding: '4px 0', textAlign: 'left', fontSize: '0.9rem', width: 'fit-content' }}
                            >
                                View all {post.comments.length} comments
                            </button>
                        )}
                    </div>
                </div>

                {/* Interaction Footer */}
                <div className="post-footer">
                    <div className="post-actions" style={{ display: 'flex', alignItems: 'center' }}>
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
                        <button 
                            className="post-action-btn comment-btn" 
                            title="Comment"
                            onClick={() => {
                                setShowAllComments(!showAllComments);
                                commentInputRef.current?.focus();
                            }}
                        >
                            <MessageCircle size={22} color="#262626" strokeWidth={2.5} />
                        </button>
                        <button className="post-action-btn share-btn" onClick={() => onShare(post)} title="Share">
                            <Share2 size={22} color="#262626" strokeWidth={2.5} />
                        </button>
                        {onReport && (
                            <button className="post-action-btn" onClick={() => onReport(post.id)} title="Report Post" style={{ marginLeft: 'auto' }}>
                                <Flag size={22} color="#ed4956" strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    <div className="post-likes-count">
                        <strong>{likeCount.toLocaleString()} likes</strong>
                    </div>

                    <div className="post-add-comment">
                        <form onSubmit={(e) => onSubmitComment(e, post.id)}>
                            <input
                                ref={commentInputRef}
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

