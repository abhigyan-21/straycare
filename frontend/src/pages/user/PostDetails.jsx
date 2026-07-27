import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getPostById, addCommentToPost, deleteComment as apiDeleteComment, toggleLikePost, reportPost as apiReportPost } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import PostCard from '../../components/user/PostCard';
import ActionLoader from '../../components/ActionLoader';
import '../../styles/user/Post.css';

function PostDetails({ openAuthModal }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, user: authUser } = useAuthStore();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const data = await getPostById(id);
                setPost(data.data);
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Failed to load post.");
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    const handleShare = async (sharedPost) => {
        const shareData = {
            title: `Check out this post from ${sharedPost.author?.name} on StrayCare!`,
            text: sharedPost.caption,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                alert('Link copied to clipboard!');
            } else {
                alert('Sharing is not supported on this browser.');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleLike = async (postId) => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        
        // Optimistic update
        const currentUserId = authUser.id;
        const isLiked = post.likes.some(like => like.userId === currentUserId);
        
        setPost(prev => ({
            ...prev,
            likes: isLiked 
                ? prev.likes.filter(like => like.userId !== currentUserId)
                : [...prev.likes, { userId: currentUserId }]
        }));

        try {
            await toggleLikePost(postId);
        } catch (error) {
            console.error('Like toggle failed:', error);
        }
    };

    const handleCommentChange = (postId, text) => {
        setNewComment(text);
    };

    const submitComment = async (e, postId) => {
        e.preventDefault();
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        if (!newComment || newComment.trim() === '') return;

        try {
            const data = await addCommentToPost(postId, newComment);
            setPost(prev => ({
                ...prev,
                comments: [...prev.comments, data.data]
            }));
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const deleteComment = async (postId, commentId) => {
        try {
            await apiDeleteComment(commentId);
            setPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c.id !== commentId)
            }));
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleReport = async (postId) => {
        if (!isLoggedIn) {
            openAuthModal('signin');
            return;
        }
        try {
            await apiReportPost(postId);
            alert("Thank you for reporting this post. Our moderation team will review it shortly.");
        } catch (error) {
            console.error("Error reporting post:", error);
            alert("Failed to report post. Please try again later.");
        }
    };

    if (loading) {
        return <ActionLoader message="Loading post..." />;
    }

    if (error || !post) {
        return (
            <div className="posts-container" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <h2>Post not found</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/post')} className="create-post-btn" style={{ marginTop: '20px' }}>
                    Go back to Feed
                </button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{post.caption ? `${post.caption.substring(0, 30)}... - StrayCare` : 'StrayCare Post'}</title>
                <meta name="description" content={post.caption || 'Check out this post on StrayCare.'} />
            </Helmet>
            <div className="posts-container">
                <button onClick={() => navigate('/post')} className="back-btn" style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    &larr; Back to Feed
                </button>
                <PostCard
                    post={post}
                    currentUser={authUser}
                    currentUserId={authUser?.id}
                    onLike={handleLike}
                    onShare={handleShare}
                    onReport={handleReport}
                    onCommentChange={handleCommentChange}
                    onSubmitComment={submitComment}
                    newComment={newComment}
                    onDeleteComment={deleteComment}
                />
            </div>
        </>
    );
}

export default PostDetails;
