import React, { useState, useEffect } from 'react';
import '../../styles/user/Post.css';
import CreatePostModal from '../../components/user/CreatePostModal';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/user/PostCard';
import MiniLoader from '../../components/user/MiniLoader';

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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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
        handleCloseCreateModal();
        setIsUploading(true);
        setUploadProgress(0);

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10 + 2; // Slower increment (2% to 12%)
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    setPosts([{
                        ...newPost,
                        username: authUser?.name || 'current_user',
                        userImage: authUser?.avatar || 'https://i.pravatar.cc/150?img=11',
                        timestamp: 'Just now',
                        location: newPost.location || null
                    }, ...posts]);
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 800); // Slightly longer "finishing" pause
            }
            setUploadProgress(progress);
        }, 400); // Slower interval (every 400ms)
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

        setNewComment({ ...newComment, [postId]: '' });
    };

    return (
        <div className="posts-container">
            <div className="create-post-header">
                <button 
                    className={`create-post-btn ${isUploading ? 'uploading' : ''}`} 
                    onClick={handleOpenCreateModal}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <div className="button-progress-wrapper">
                            <div 
                                className="button-progress-fill" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                            <div className="button-progress-content">
                                <MiniLoader />
                                <span>Posting... {Math.round(uploadProgress)}%</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="plus-icon">+</span> Create a Post
                        </>
                    )}
                </button>
            </div>

            {posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    onLike={handleLike}
                    onShare={handleShare}
                    onCommentChange={handleCommentChange}
                    onSubmitComment={submitComment}
                    newComment={newComment[post.id]}
                />
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

