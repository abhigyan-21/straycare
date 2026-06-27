import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchPosts, createPost, toggleLikePost, addCommentToPost, deleteComment as apiDeleteComment } from '../services/api';
import { isCacheValid, TTL } from '../utils/cacheUtils';

export const usePostStore = create(
    persist(
        (set, get) => ({
            posts: [],
            lastFetched: null,
            loading: false,
            error: null,
            page: 1,
            hasMore: true,

            // ── Fetch Posts (with TTL + stale-while-revalidate) ───────────────
            fetchPosts: async (pageNumber = 1, limit = 10) => {
                const { posts, lastFetched } = get();
                const isPage1 = pageNumber === 1;
                const cacheHit = isPage1 && isCacheValid(lastFetched, TTL.posts) && posts.length > 0;

                if (cacheHit) {
                    // Serve cached data immediately — no loading state, no API call
                    return;
                }

                // If page 1 has stale data, show it instantly and revalidate silently
                const hasStalePage1 = isPage1 && posts.length > 0 && !isCacheValid(lastFetched, TTL.posts);

                if (!hasStalePage1) {
                    set({ loading: true, error: null });
                }

                try {
                    const data = await fetchPosts(pageNumber, limit);
                    const newPosts = data.data;
                    const pagination = data.pagination || {};
                    set((state) => ({
                        posts: pageNumber === 1 ? newPosts : [...state.posts, ...newPosts],
                        page: pageNumber,
                        hasMore: pagination.hasMore !== undefined ? pagination.hasMore : false,
                        lastFetched: pageNumber === 1 ? Date.now() : state.lastFetched,
                        loading: false,
                    }));
                } catch (error) {
                    set({ error: error.message || 'Failed to fetch posts', loading: false });
                }
            },

            // ── Create Post (optimistic prepend) ─────────────────────────────
            createPost: async (formData) => {
                set({ loading: true, error: null });
                try {
                    const data = await createPost(formData);
                    set((state) => ({
                        posts: [data.data, ...state.posts],
                        lastFetched: Date.now(), // refresh cache timestamp
                        loading: false,
                    }));
                } catch (error) {
                    set({ error: error.message || 'Failed to create post', loading: false });
                }
            },

            // ── Toggle Like (optimistic update) ──────────────────────────────
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

            // ── Add Comment (optimistic append) ──────────────────────────────
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
            },

            // ── Delete Comment (optimistic update) ───────────────────────────
            deleteComment: async (postId, commentId) => {
                set((state) => ({
                    posts: state.posts.map(post => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                comments: post.comments.filter(c => c.id !== commentId)
                            };
                        }
                        return post;
                    })
                }));

                try {
                    await apiDeleteComment(commentId);
                } catch (error) {
                    console.error('Failed to delete comment:', error);
                    // Reverting optimistic update in case of failure could be added here
                }
            },

            // ── Remove a post from cache (called by profileStore on delete) ──
            removePost: (postId) => {
                set((state) => ({
                    posts: state.posts.filter(p => p.id !== postId)
                }));
            },

            // ── Invalidate cache (forces re-fetch on next visit) ─────────────
            invalidateCache: () => set({ lastFetched: null }),

            // ── Clear all post data (called on logout) ────────────────────────
            clearCache: () => set({ posts: [], lastFetched: null, page: 1, hasMore: true }),
        }),
        {
            name: 'straycare_posts',
            // Only persist the data & timestamp — not loading/error/pagination state
            partialize: (state) => ({
                posts: state.posts,
                lastFetched: state.lastFetched,
            }),
        }
    )
);
