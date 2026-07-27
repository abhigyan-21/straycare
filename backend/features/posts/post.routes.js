const express = require('express');
const router = express.Router();
const postController = require('./post.controller');
const { upload } = require('../../utils/cloudinary');
const { verifyToken } = require('../../features/auth/auth.middleware');

// GET /api/posts - Fetch all posts
router.get('/', postController.getPosts);

// GET /api/posts/:id - Fetch a single post
router.get('/:id', postController.getPostById);

// GET /api/posts/my-posts - Fetch logged-in user's posts
router.get('/my-posts', verifyToken, postController.getMyPosts);

// POST /api/posts - Create a new post
router.post('/', verifyToken, upload.single('image'), postController.createPost);

// POST /api/posts/:id/like - Toggle like
router.post('/:id/like', verifyToken, postController.toggleLike);

// POST /api/posts/:id/comment - Add comment
router.post('/:id/comment', verifyToken, postController.addComment);

// DELETE /api/posts/comment/:commentId - Delete a comment
router.delete('/comment/:commentId', verifyToken, postController.deleteComment);

// DELETE /api/posts/:id - Delete a post (author only)
router.delete('/:id', verifyToken, postController.deletePost);

// POST /api/posts/:id/report - Report a post
router.post('/:id/report', verifyToken, postController.reportPost);

module.exports = router;
