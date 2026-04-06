const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken, allowRoles } = require('./auth.middleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' }
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Example protected route for verification
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
