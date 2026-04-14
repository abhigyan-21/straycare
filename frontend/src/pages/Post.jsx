import React, { useState, useEffect } from 'react';
import '../styles/Post.css';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share2, MapPin, Send } from 'lucide-react';

// Mock data for posts
const initialPosts = [
    {
        id: 1,
        username: 'straycare_official',
        userImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=100&q=80',
        postImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
        caption: 'Meet Bella! She is looking for a forever home. Come visit her at our shelter today! 🐶❤️ #adopt #straydogs #rescue',
        likes: 342,
        isLiked: false,
        comments: [
            { id: 1, username: 'doglover99', text: 'She is so cute!! 😍' },
            { id: 2, username: 'mark_t', text: 'What breed is she?' }
        ],
        timestamp: '2 hours ago',
        location: 'Beverly Hills, CA'
    },
    {
        id: 2,
        username: 'volunteer_sarah',
        userImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
        postImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
        caption: 'Luna just got her vaccinations and is ready to be adopted! She loves to play with feather toys. 😸 #catadoption #foster',
        likes: 890,
        isLiked: false,
        comments: [
            { id: 1, username: 'catlady4ever', text: 'I want her! Sending a DM.' }
        ],
        timestamp: '5 hours ago',
        location: 'Central Park, NY'
    }
];

function Post({ openAuthModal }) {
    const { isLoggedIn, user: authUser } = useAuth();
    const [posts, setPosts] = useState(initialPosts);
    const [newComment, setNewComment] = useState({});

    // Create Post Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Scroll Lock Effect (Fix for trackpad scrolling)
    useEffect(() => {
        if (isCreateModalOpen) {
            document.documentElement.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
        }
        return () => {
            document.documentElement.classList.remove('no-scroll');
        };
    }, [isCreateModalOpen]);

    const handleOpenCreateModal = () => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreatePostSubmit = (newPost) => {
        setPosts([{
            ...newPost,
            username: authUser?.name || 'current_user',
            userImage: authUser?.avatar || 'https://i.pravatar.cc/150?img=11',
            timestamp: 'Just now',
            location: newPost.location || null
        }, ...posts]);
    };

    const handleShare = async (post) => {
        const shareData = {
            title: `Check out this post from ${post.username} on StrayCare!`,
            text: post.caption,
            url: window.location.origin + '/post/' + post.id
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleLike = (postId) => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1
                };
            }
            return post;
        }));
    };

    const handleCommentChange = (postId, text) => {
        setNewComment({ ...newComment, [postId]: text });
    };

    const submitComment = (e, postId) => {
        e.preventDefault();
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        if (!newComment[postId] || newComment[postId].trim() === '') return;

        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [
                        ...post.comments,
                        {
                            id: Date.now(),
                            username: authUser?.name || 'current_user',
                            text: newComment[postId]
                        }
                    ]
                };
            }
            return post;
        }));

        // Clear input
        setNewComment({ ...newComment, [postId]: '' });
    };


    return (
        <div className="posts-container">

            <div className="create-post-header">
                <button className="create-post-btn" onClick={handleOpenCreateModal}>
                    <span className="plus-icon">+</span> Create a Post
                </button>
            </div>

            {posts.map(post => (
                <div key={post.id} className="post-card">
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
                                    onClick={() => handleLike(post.id)}
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
                                <button className="post-action-btn share-btn" onClick={() => handleShare(post)} title="Share">
                                    <Share2 size={22} color="#262626" strokeWidth={2.5} />
                                </button>
                            </div>
                            <div className="post-likes-count">
                                <strong>{post.likes.toLocaleString()} likes</strong>
                            </div>

                            <div className="post-add-comment">
                                <form onSubmit={(e) => submitComment(e, post.id)}>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={newComment[post.id] || ''}
                                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        className="post-btn"
                                        disabled={!newComment[post.id] || newComment[post.id].trim() === ''}
                                    >
                                        Post
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreatePostSubmit}
            />
        </div>
    );
}

export default Post;
