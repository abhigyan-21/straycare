import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/user/Post.css';
import CreatePostModal from '../../components/user/CreatePostModal';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import PostCard from '../../components/user/PostCard';
import MiniLoader from '../../components/user/MiniLoader';

function Post({ openAuthModal }) {
    const { isLoggedIn, user: authUser } = useAuthStore();
    const { posts, loading, fetchPosts, createPost, toggleLike, addComment } = usePostStore();
    const [newComment, setNewComment] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

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

    const handleCreatePostSubmit = async (formData) => {
        handleCloseCreateModal();
        setIsUploading(true);
        await createPost(formData);
        setIsUploading(false);
    };

    const handleShare = async (post) => {
        const shareData = {
            title: `Check out this post from ${post.author?.name} on StrayCare!`,
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
        toggleLike(postId, authUser.id);
    };

    const handleCommentChange = (postId, text) => {
        setNewComment({ ...newComment, [postId]: text });
    };

    const submitComment = async (e, postId) => {
        e.preventDefault();
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        if (!newComment[postId] || newComment[postId].trim() === '') return;

        await addComment(postId, newComment[postId]);
        setNewComment({ ...newComment, [postId]: '' });
    };

    return (
        <>
        <Helmet>
            <title>Furzo - Community Feed</title>
            <meta name="description" content="Share animal rescue stories, adoption successes, and connect with the Furzo animal welfare community." />
        </Helmet>
        <div className="posts-container">
            <div className="create-post-header">
                <button 
                    className={`create-post-btn ${isUploading ? 'uploading' : ''}`} 
                    onClick={handleOpenCreateModal}
                    disabled={isUploading || loading}
                >
                    {isUploading ? (
                        <div className="button-progress-wrapper">
                            <div className="button-progress-fill"></div>
                            <div className="button-progress-content">
                                <MiniLoader />
                                <span>Posting...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="plus-icon">+</span> Create a Post
                        </>
                    )}
                </button>
            </div>

            {loading && posts.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <MiniLoader />
                </div>
            ) : (
                posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={authUser?.id}
                        onLike={handleLike}
                        onShare={handleShare}
                        onCommentChange={handleCommentChange}
                        onSubmitComment={submitComment}
                        newComment={newComment[post.id]}
                    />
                ))
            )}

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreatePostSubmit}
            />
        </div>
        </>
    );
}

export default Post;

