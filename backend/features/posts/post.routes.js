const express = require('express');
const router = express.Router();
const postController = require('./post.controller');
const { upload } = require('../../utils/cloudinary');
const { requireAuth } = require('../../features/auth/auth.middleware');

// GET /api/posts - Fetch all posts
router.get('/', postController.getPosts);

// POST /api/posts - Create a new post
router.post('/', requireAuth, upload.single('image'), postController.createPost);

// POST /api/posts/:id/like - Toggle like
router.post('/:id/like', requireAuth, postController.toggleLike);

// POST /api/posts/:id/comment - Add comment
router.post('/:id/comment', requireAuth, postController.addComment);

module.exports = router;
