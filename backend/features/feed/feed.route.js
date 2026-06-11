const express = require('express');
const router = express.Router();
const feedController = require('./feed.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Protected feed routes
router.get('/my-posts', verifyToken, feedController.getMyPosts);
router.post('/', verifyToken, feedController.createPost);
router.patch('/:id', verifyToken, feedController.updatePost);
router.delete('/:id', verifyToken, feedController.deletePost);

module.exports = router;
