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

router.post('/request-email-otp', verifyToken, authController.requestEmailOtp);
router.post('/request-phone-otp', verifyToken, authController.requestPhoneOtp);

router.post('/verify-email', verifyToken, authController.verifyEmail);
router.post('/verify-phone', verifyToken, authController.verifyPhone);


router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Health check for frontend detection
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Example protected route for verification
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
