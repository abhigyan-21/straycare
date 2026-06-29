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
      if (existingUserByEmail.isEmailVerified) {
        return res.status(400).json({ error: 'Email is already in use' });
      } else {
        try {
          await prisma.user.delete({ where: { id: existingUserByEmail.id } });
        } catch (error) {
          console.error('Error deleting unverified user by email:', error);
          return res.status(400).json({ error: 'Email is already in use' });
        }
      }
    }

    const existingUserByPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingUserByPhone) {
      if (existingUserByPhone.isEmailVerified) {
        return res.status(400).json({ error: 'Phone number is already in use' });
      } else {
        try {
          await prisma.user.delete({ where: { id: existingUserByPhone.id } });
        } catch (error) {
          console.error('Error deleting unverified user by phone:', error);
          return res.status(400).json({ error: 'Phone number is already in use' });
        }
      }
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
  <div style="margin:0; padding:20px; background-color:#f4f7f2; font-family:Arial, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #d8eecf;">

      <!-- Header -->
      <div style="background:#346c02; padding:30px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:32px;">
          Furzo
        </h1>
        <p style="margin:8px 0 0; color:#d9f8d0; font-size:14px;">
          Verify Your Email Address
        </p>
      </div>

      <!-- Content -->
      <div style="padding:40px 30px; color:#333333;">
        <h2 style="margin-top:0; color:#346c02;">
          Email Verification Code
        </h2>

        <p style="font-size:16px; line-height:1.6;">
          Thank you for joining Furzo. Use the OTP below to verify your email address and complete your account setup.
        </p>

        <div style="text-align:center; margin:35px 0;">
          <div style="
            display:inline-block;
            background:#f2ffe9;
            border:2px dashed #346c02;
            border-radius:10px;
            padding:18px 35px;
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            color:#346c02;">
            ${emailOtpData.otp}
          </div>
        </div>

        <p style="font-size:15px; line-height:1.6;">
          This verification code is valid for <strong>5 minutes</strong>.
        </p>

        <p style="font-size:15px; line-height:1.6;">
          If you did not request this code, please ignore this email. No further action is required.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8faf7; padding:20px 30px; border-top:1px solid #e5e5e5;">
        <p style="margin:0; font-size:13px; color:#666666;">
          This is an automated email from Furzo. Please do not reply to this message.
        </p>

        <p style="margin-top:10px; font-size:13px; color:#666666;">
          Thank you for helping create a safer world for stray animals.
        </p>

        <p style="margin-top:10px; font-size:12px; color:#999999;">
          © 2026 Furzo. All rights reserved.
        </p>
        </div>

      </div>
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
 * @desc Send OTP for Partner Registration email verification
 * @route POST /api/auth/send-registration-otp
 * @access Public
 */
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    const { otp, expiry } = generateOTP();
    console.log(`[Registration OTP] Generated OTP for ${email}: ${otp} (expires: ${expiry})`);

    // Send verification email in the background
    sendEmail({
      to: email,
      subject: 'Verify your email for StrayCare Partner Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #346c02; text-align: center;">Partner Registration Email Verification</h2>
          <p>Thank you for starting your partner registration with StrayCare.</p>
          <p>Please use the following 6-digit OTP code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 2.5rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #666; text-align: center;">This code is valid for 5 minutes.</p>
        </div>
      `
    })
      .then(result => {
        if (result.success) {
          console.log(`✅ [OTP Success] Registration OTP email successfully sent to ${email}`);
        } else {
          console.error(`❌ [OTP Error] Failed to send registration OTP email to ${email}:`, result.error);
        }
      })
      .catch(err => console.error(`❌ [OTP Error] Exception sending registration OTP email to ${email}:`, err));

    // Create a signed token containing the email and otp
    const verificationToken = jwt.sign(
      { email, otp },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({ verificationToken });
  } catch (error) {
    console.error('Error sending registration OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Verify OTP for Partner Registration email verification
 * @route POST /api/auth/verify-registration-otp
 * @access Public
 */
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp, verificationToken } = req.body;
    if (!email || !otp || !verificationToken) {
      return res.status(400).json({ error: 'Email, OTP, and verification token are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Verification session expired or invalid. Please request a new OTP.' });
    }

    if (decoded.email !== email || decoded.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // Generate a register token that registration endpoint can verify
    const registerToken = jwt.sign(
      { email, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({ success: true, registerToken });
  } catch (error) {
    console.error('Error verifying registration OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Register a new partner (NGO / Vet Clinic / Hospital)
 * @route POST /api/auth/register-partner
 * @access Public
 */
const registerPartner = async (req, res) => {
  try {
    const { organizationName, organizationType, email, phone, registrationNumber, address, city, state, password, registerToken, razorpayId, lat, lng, upiId, upiQrCode } = req.body;

    if (!organizationName || !organizationType || !email || !phone || !registrationNumber || !address || !password || !upiId || !upiQrCode) {
      return res.status(400).json({ error: 'All required fields must be provided, including UPI details' });
    }

    if (!registerToken) {
      return res.status(400).json({ error: 'Email verification is required before registration.' });
    }

    let decodedRegister;
    try {
      decodedRegister = jwt.verify(registerToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Email verification expired. Please verify your email again.' });
    }

    if (decodedRegister.email !== email || !decodedRegister.verified) {
      return res.status(400).json({ error: 'Email verification does not match registration email.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
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

    // Determine role: NGO or VET
    const dbRole = organizationType === 'ngo' ? 'NGO' : 'VET';

    // If role is VET or NGO, we also create a Partner record
    let partnerId = null;
    if (dbRole === 'VET' || dbRole === 'NGO') {
      const partner = await prisma.partner.create({
        data: {
          name: organizationName,
          address: address,
          phone,
          verificationStatus: 'PENDING',
          partnerType: dbRole === 'NGO' ? 'NGO' : 'VET',
          razorpayAccountId: razorpayId || null,
          upiId,
          upiQrCode,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          city: city || null,
          state: state || null
        }
      });
      partnerId = partner.id;
    }

    // Create User record
    const user = await prisma.user.create({
      data: {
        name: organizationName,
        email,
        phone,
        password: hashedPassword,
        role: dbRole,
        status: 'Pending',
        isEmailVerified: true, // Auto verify email since it is reviewed by administrator
        partnerId: partnerId,
        contact: phone
      }
    });

    // Create PetDocument storing the registration number and address details
    await prisma.petDocument.create({
      data: {
        userId: user.id,
        name: `Registration Certificate - ${organizationName}`,
        type: 'REGISTRATION',
        fileData: JSON.stringify({
          organizationName,
          organizationType,
          registrationNumber,
          address,
          email,
          phone,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null
        })
      }
    });

    // Exclude password and other fields from the response
    const { password: _, refreshToken: __, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error during partner registration:', error);
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

    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    if (user.status === 'Pending') {
      return res.status(403).json({ error: 'Your account is pending administrator approval.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, partnerId: user.partnerId, clinicId: user.partnerId },
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

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'Forbidden: Account is not active' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, partnerId: user.partnerId, clinicId: user.partnerId },
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
  <div style="margin:0; padding:20px; background-color:#f4f7f2; font-family:Arial, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #d8eecf;">

      <!-- Header -->
      <div style="background:#346c02; padding:30px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:32px;">
          Furzo
        </h1>
        <p style="margin:8px 0 0; color:#d9f8d0; font-size:14px;">
          Verify Your Email Address
        </p>
      </div>

      <!-- Content -->
      <div style="padding:40px 30px; color:#333333;">
        <h2 style="margin-top:0; color:#346c02;">
          Email Verification Code
        </h2>

        <p style="font-size:16px; line-height:1.6;">
          Thank you for joining Furzo. Use the OTP below to verify your email address and complete your account setup.
        </p>

        <div style="text-align:center; margin:35px 0;">
          <div style="
            display:inline-block;
            background:#f2ffe9;
            border:2px dashed #346c02;
            border-radius:10px;
            padding:18px 35px;
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            color:#346c02;">
            ${otp}
          </div>
        </div>

        <p style="font-size:15px; line-height:1.6;">
          This verification code is valid for <strong>5 minutes</strong>.
        </p>

        <p style="font-size:15px; line-height:1.6;">
          If you did not request this code, please ignore this email. No further action is required.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8faf7; padding:20px 30px; border-top:1px solid #e5e5e5;">
        <p style="margin:0; font-size:13px; color:#666666;">
          This is an automated email from Furzo. Please do not reply to this message.
        </p>

        <p style="margin-top:10px; font-size:13px; color:#666666;">
          Thank you for helping create a safer world for stray animals.
        </p>

        <p style="margin-top:10px; font-size:12px; color:#999999;">
          © 2026 Furzo. All rights reserved.
        </p>
        </div>

      </div>
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
    const { name, email, phone, avatarUrl, clinicLat, clinicLng, upiId, upiQrCode, razorpayId, address, city, state } = req.body;

    if (!name && !email && !phone && avatarUrl === undefined && clinicLat === undefined && clinicLng === undefined && upiId === undefined && upiQrCode === undefined && razorpayId === undefined && address === undefined && city === undefined && state === undefined) {
      return res.status(400).json({ error: 'At least one field is required to update.' });
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

    // Update clinic/center coordinates if user is VET or NGO
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, partnerId: true }
    });

    if (currentUser && (currentUser.role === 'VET' || currentUser.role === 'NGO') && currentUser.partnerId) {
      if (address !== undefined || clinicLat !== undefined || clinicLng !== undefined || upiId !== undefined || upiQrCode !== undefined || razorpayId !== undefined || city !== undefined || state !== undefined) {
        await prisma.partner.update({
          where: { id: currentUser.partnerId },
          data: {
            ...(address !== undefined && { address: address || null }),
            ...(city !== undefined && { city: city || null }),
            ...(state !== undefined && { state: state || null }),
            ...(clinicLat !== undefined && { lat: clinicLat !== null ? parseFloat(clinicLat) : null }),
            ...(clinicLng !== undefined && { lng: clinicLng !== null ? parseFloat(clinicLng) : null }),
            ...(upiId !== undefined && { upiId: upiId || null }),
            ...(upiQrCode !== undefined && { upiQrCode: upiQrCode || null }),
            ...(razorpayId !== undefined && { razorpayAccountId: razorpayId || null })
          }
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      include: {
        partner: true
      }
    });

    const { password: _, refreshToken: __, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Change user password
 * @route POST /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordStrengthRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Request password reset OTP
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No user registered with this email address' });
    }

    const { otp, expiry } = generateOTP();
    console.log(`[Forgot Password OTP Info] Generated reset OTP for user ${email}: ${otp} (expires: ${expiry})`);

    await prisma.user.update({
      where: { email },
      data: {
        emailOtp: otp,
        emailOtpExpiry: expiry
      }
    });

    console.log(`[Forgot Password OTP Info] Attempting to send reset email to ${email}...`);
    sendEmail({
      to: email,
      subject: 'Reset your Furzo Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: auto; margin: 0 auto; padding: 20px; border: 5px solid #bdf9aeff; border-radius: 8px;">
          <h1 style="text-align: center;">Welcome to Furzo!</h1>
          <h2 style="color: #346c02; text-align: center;">Reset Code</h2>
          <p>Please use the following OTP code to reset your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 2rem; font-weight: bold; letter-spacing: 5px; color: #346c02;">${otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #666;">Thank you for using Furzo!</p>
          <p style="font-size: 0.9rem; color: #666;">This code is valid for 5 minutes.</p>
          <p style="font-size: 0.9rem; color: #666;">Disclaimer: This is an auto-generated email. Please do not reply to this email.</p>
          <p style="font-size: 0.9rem; color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    })
      .then(result => {
        if (result.success) {
          console.log(`✅ [Forgot Password Success] Reset email successfully sent to ${email}`);
        } else {
          console.error(`❌ [Forgot Password Error] Failed to send reset email to ${email}:`, result.error);
        }
      })
      .catch(err => console.error(`❌ [Forgot Password Error] Exception sending reset email to ${email}:`, err));

    res.status(200).json({ status: 'success', message: 'Password reset OTP sent successfully' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Verify OTP and reset password
 * @route POST /api/auth/reset-password
 * @access Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailOtp !== otp || new Date() > user.emailOtpExpiry) {
      console.warn(`⚠️ [Forgot Password OTP Warning] Verification failed for user ${email}. Provided OTP: ${otp}, expected: ${user.emailOtp}, expiry: ${user.emailOtpExpiry}`);
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordStrengthRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailOtp: null,
        emailOtpExpiry: null,
        isEmailVerified: true
      }
    });

    console.log(`✅ [Forgot Password Success] Password successfully reset for user ${email}`);

    res.status(200).json({ status: 'success', message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  register,
  registerPartner,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  login,
  refresh,
  verifyEmail,
  requestEmailOtp,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
