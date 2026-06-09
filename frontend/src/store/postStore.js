import { create } from 'zustand';
import { fetchPosts, createPost, toggleLikePost, addCommentToPost } from '../services/api';

export const usePostStore = create((set, get) => ({
    posts: [],
    loading: false,
    error: null,

    fetchPosts: async () => {
        set({ loading: true, error: null });
        try {
            const data = await fetchPosts();
            set({ posts: data.data, loading: false });
        } catch (error) {
            set({ error: error.message || 'Failed to fetch posts', loading: false });
        }
    },

    createPost: async (formData) => {
        set({ loading: true, error: null });
        try {
            const data = await createPost(formData);
            set((state) => ({ 
                posts: [data.data, ...state.posts], 
                loading: false 
            }));
        } catch (error) {
            set({ error: error.message || 'Failed to create post', loading: false });
        }
    },

    toggleLike: async (postId, currentUserId) => {
        set((state) => ({
            posts: state.posts.map(post => {
                if (post.id === postId) {
                    const isLiked = post.likes.some(like => like.userId === currentUserId);
                    return {
                        ...post,
                        likes: isLiked 
                            ? post.likes.filter(like => like.userId !== currentUserId)
                            : [...post.likes, { userId: currentUserId }]
                    };
                }
                return post;
            })
        }));

        try {
            await toggleLikePost(postId);
        } catch (error) {
            console.error('Like toggle failed:', error);
        }
    },

    addComment: async (postId, text) => {
        try {
            const data = await addCommentToPost(postId, text);
            set((state) => ({
                posts: state.posts.map(post => {
                    if (post.id === postId) {
                        return {
                            ...post,
                            comments: [...post.comments, data.data]
                        };
                    }
                    return post;
                })
            }));
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    }
}));
