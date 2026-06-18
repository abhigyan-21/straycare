import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import '../../styles/user/Post.css';
import CreatePostModal from '../../components/user/CreatePostModal';
import { useAuthStore } from '../../store/authStore';
import { usePostStore } from '../../store/postStore';
import PostCard from '../../components/user/PostCard';
import MiniLoader from '../../components/user/MiniLoader';
import ActionLoader from '../../components/ActionLoader';
import PullToRefresh from 'react-simple-pull-to-refresh';

function Post({ openAuthModal }) {
    const { isLoggedIn, user: authUser } = useAuthStore();
    const { posts, loading, fetchPosts, createPost, toggleLike, addComment, page, hasMore, invalidateCache } = usePostStore();
    const [newComment, setNewComment] = useState({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchPosts(1);
    }, [fetchPosts]);

    useEffect(() => {
        const handleScroll = () => {
            if (loading || !hasMore) return;
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 150) {
                fetchPosts(page + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [page, hasMore, loading, fetchPosts]);

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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        invalidateCache();
        await fetchPosts(1);
        setIsRefreshing(false);
    };

    return (
        <>
            <Helmet>
                <title>Furzo - Community Feed</title>
                <meta name="description" content="Share animal rescue stories, adoption successes, and connect with the Furzo animal welfare community." />
            </Helmet>
            <PullToRefresh onRefresh={handleRefresh} pullingContent="" >
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
                    <button
                        className="refresh-btn-common desktop-only-refresh"
                        onClick={handleRefresh}
                        disabled={loading || isRefreshing}
                    >
                        {isRefreshing ? (
                            <><span className="icon-spin">↻</span> Refreshing...</>
                        ) : (
                            '↻ Refresh'
                        )}
                    </button>
                </div>

                {loading && posts.length === 0 ? (
                    <ActionLoader message="Loading posts..." />
                ) : (
                    <>
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUser={authUser}
                                currentUserId={authUser?.id}
                                onLike={handleLike}
                                onShare={handleShare}
                                onCommentChange={handleCommentChange}
                                onSubmitComment={submitComment}
                                newComment={newComment[post.id]}
                            />
                        ))}
                        {loading && (
                            <div className="posts-loading-more" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                <MiniLoader /> <span style={{ marginLeft: '8px', color: '#666' }}>Loading more posts...</span>
                            </div>
                        )}
                    </>
                )}

                <CreatePostModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onSubmit={handleCreatePostSubmit}
                />
                </div>
            </PullToRefresh>
        </>
    );
}

export default Post;

