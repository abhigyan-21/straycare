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

    console.log(`[OTP Info] Generated registration OTP for ${user.email}: ${emailOtpData.otp} (expires: ${emailOtpData.expiry})`);
    console.log(`[OTP Info] Attempting to send registration email to ${user.email}...`);

    // Send verification email in the background
    sendEmail({
      to: user.email,
      subject: 'Verify your Furzo Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h1 style="color: #346c02; text-align: center;">Welcome to Furzo!</h1>
          <p style="font-size: 5rem; text-align: center; color: #666;">Please use the following OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 3rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${emailOtpData.otp}</span>
          </div>
          <p style="font-size: 0.9rem; text-align: center; color: #666;">This code is valid for 5 minutes.</p>
        </div>
      `
    })
      .then(result => {
        if (result.success) {
          console.log(`✅ [OTP Success] Registration email successfully sent to ${user.email}`);
        } else {
          console.error(`❌ [OTP Error] Failed to send registration email to ${user.email}:`, result.error);
        }
      })
      .catch(err => console.error(`❌ [OTP Error] Exception sending registration email to ${user.email}:`, err));

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
      console.warn(`⚠️ [OTP Warning] Verification failed for user ${user.email}. Provided OTP: ${otp}, expected: ${user.emailOtp}, expiry: ${user.emailOtpExpiry}`);
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

    console.log(`✅ [OTP Success] Email verified successfully for user ${user.email}`);

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
    console.log(`[OTP Info] Generated new verification OTP for user ID ${userId} (${user.email}): ${otp} (expires: ${expiry})`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailOtp: otp,
        emailOtpExpiry: expiry
      }
    });

    console.log(`[OTP Info] Attempting to send new OTP verification email to ${user.email}...`);
    sendEmail({
      to: user.email,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: auto; margin: 0 auto; padding: 20px; border: 5px solid #bdf9aeff; border-radius: 8px;">
          <h1 style="text-align: center;">Welcome to Furzo!</h1>
          <h2 style="color: #346c02; text-align: center;">Email Verification Code</h2>
          <p>Please use the following new OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #666;">Thank you for being a part of Furzo!</p>
          <p style="font-size: 0.9rem; color: #666;">This code is valid for 5 minutes.</p>
          <p style="font-size: 0.9rem; color: #666;">Disclaimer: This is an auto-generated email. Please do not reply to this email.</p>
          <p style="font-size: 0.9rem; color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    })
      .then(result => {
        if (result.success) {
          console.log(`✅ [OTP Success] Verification email successfully sent to ${user.email}`);
        } else {
          console.error(`❌ [OTP Error] Failed to send verification email to ${user.email}:`, result.error);
        }
      })
      .catch(err => console.error(`❌ [OTP Error] Exception sending verification email to ${user.email}:`, err));

    res.status(200).json({ status: 'success', message: 'New email verification OTP code sent successfully!' });
  } catch (error) {
    console.error('Error resending email OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, avatarUrl } = req.body;

    if (!name && !email && !phone && avatarUrl === undefined) {
      return res.status(400).json({ error: 'At least one field (name, email, phone, or avatarUrl) is required to update.' });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
    }

    // Validate phone/contact if provided
    if (phone) {
      if (phone.length < 10) {
        return res.status(400).json({ error: 'Phone number must be at least 10 digits' });
      }
      const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingUserByPhone && existingUserByPhone.id !== userId) {
        return res.status(400).json({ error: 'Phone number is already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      }
    });

    const { password: _, refreshToken: __, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  requestEmailOtp,
  updateProfile,
};
