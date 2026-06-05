const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { verifyToken, allowRoles } = require('../auth/auth.middleware');

// All administrative routes are protected and restricted to users with ADMIN role
router.use(verifyToken);
router.use(allowRoles('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/documents', adminController.getDocuments);
router.get('/tracking', adminController.getTracking);
router.get('/posts', adminController.getPosts);
router.patch('/posts/:id/status', adminController.updatePostStatus);
router.delete('/posts/:id', adminController.deletePost);
router.get('/reports', adminController.getReports);

module.exports = router;
