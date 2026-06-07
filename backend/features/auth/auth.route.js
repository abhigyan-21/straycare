const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken, allowRoles } = require('./auth.middleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit Warning] Auth rate limit exceeded for IP ${req.ip} on route: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Max 5 requests per 5 minutes per IP
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit Warning] OTP rate limit exceeded for IP ${req.ip} on route: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
  message: { error: 'Too many OTP requests from this IP, please try again in 5 minutes.' }
});

router.post('/request-email-otp', otpLimiter, verifyToken, authController.requestEmailOtp);

router.post('/verify-email', otpLimiter, verifyToken, authController.verifyEmail);


router.post('/register', authLimiter, authController.register);
router.post('/register-partner', authLimiter, authController.registerPartner);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Health check for frontend detection
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Example protected route for verification
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

router.patch('/profile', verifyToken, authController.updateProfile);
router.post('/change-password', verifyToken, authController.changePassword);
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authController.resetPassword);

module.exports = router;
