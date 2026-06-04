const prisma = require('../../db/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../../utils/otp');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character' });
    }

    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'Phone number is already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailOtpData = generateOTP();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailOtp: emailOtpData.otp,
        emailOtpExpiry: emailOtpData.expiry,
        isPhoneVerified: true
      }
    });

    // Send verification email in the background
    sendEmail({
      to: user.email,
      subject: 'Verify your Furzo Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #346c02; text-align: center;">Welcome to StrayCare!</h2>
          <p>Please use the following OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${emailOtpData.otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #666;">This code is valid for 5 minutes.</p>
        </div>
      `
    }).catch(err => console.error(`❌ Error sending registration email to ${user.email}:`, err.message));

    // Exclude password and OTP details from response
    const { password: _, emailOtp: _1, emailOtpExpiry: _2, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Authenticate user and get tokens
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { password: _, refreshToken: __, ...userWithoutPassword } = user;
    res.json({ token, refreshToken, user: userWithoutPassword });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Refresh access token
 * @route POST /api/auth/refresh
 * @access Public
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error during token refresh:', error);
    res.status(403).json({ error: 'Forbidden: Invalid or expired refresh token' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    if (!otp) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    if (user.emailOtp !== otp || new Date() > user.emailOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailOtp: null,
        emailOtpExpiry: null
      }
    });

    res.status(200).json({ status: 'success', message: 'Email address verified successfully!' });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const requestEmailOtp = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const { otp, expiry } = generateOTP();

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailOtp: otp,
        emailOtpExpiry: expiry
      }
    });

    sendEmail({
      to: user.email,
      subject: 'New Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #346c02; text-align: center;">Email Verification Code</h2>
          <p>Please use the following new OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #666;">This code is valid for 5 minutes.</p>
        </div>
      `
    }).catch(err => console.error(`❌ Error sending verification email to ${user.email}:`, err.message));

    res.status(200).json({ status: 'success', message: 'New email verification OTP code sent successfully!' });
  } catch (error) {
    console.error('Error resending email OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  requestEmailOtp,
};
