const prisma = require('../../db/prisma');
const { sendEmail } = require('../../services/email.service');
const { generateToken } = require('../auth/auth.middleware');

/**
 * @desc Get all rescuers linked to the current vet's partner
 * @route GET /api/users/rescuers
 * @access Private (Vet/Admin)
 */
const getClinicRescuers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch the current user to get their partnerId
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { partnerId: true }
    });

    if (!currentUser || !currentUser.partnerId) {
      return res.status(400).json({ error: 'You are not associated with any partner' });
    }

    const rescuers = await prisma.user.findMany({
      where: {
        partnerId: currentUser.partnerId,
        role: 'RESCUER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        avatarUrl: true
      }
    });

    res.json(rescuers);
  } catch (error) {
    console.error('Error fetching rescuers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Add an existing user as a rescuer for the clinic
 * @route POST /api/users/rescuers/add
 * @access Private (Vet/Admin)
 */
const addRescuer = async (req, res) => {
  try {
    const { email, contact } = req.body;
    const vetId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Get Vet's partnerId
    const vetUser = await prisma.user.findUnique({
      where: { id: vetId },
      select: { partnerId: true }
    });

    if (!vetUser || !vetUser.partnerId) {
      return res.status(400).json({ error: 'You are not associated with any partner' });
    }

    // Find the user to be promoted
    const userToPromote = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToPromote) {
      return res.status(404).json({ error: 'User not found. Please ask them to register on StrayCare first.' });
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userToPromote.id },
      data: {
        role: 'RESCUER',
        partnerId: vetUser.partnerId,
        contact: contact || userToPromote.contact
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true
      }
    });

    res.json({ message: 'Rescuer added successfully', rescuer: updatedUser });
  } catch (error) {
    console.error('Error adding rescuer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Remove a rescuer (demote back to USER)
 * @route POST /api/users/rescuers/remove/:id
 * @access Private (Vet/Admin)
 */
const removeRescuer = async (req, res) => {
  try {
    const rescuerId = req.params.id;
    const vetId = req.user.id;

    // Get Vet's partnerId
    const vetUser = await prisma.user.findUnique({
      where: { id: vetId },
      select: { partnerId: true }
    });

    if (!vetUser || !vetUser.partnerId) {
      return res.status(400).json({ error: 'You are not associated with any partner' });
    }

    // Find the rescuer and ensure they belong to this clinic
    const rescuer = await prisma.user.findUnique({
      where: { id: rescuerId }
    });

    if (!rescuer || rescuer.partnerId !== vetUser.partnerId) {
      return res.status(404).json({ error: 'Rescuer not found in your partner organization' });
    }

    // Demote the user
    await prisma.user.update({
      where: { id: rescuerId },
      data: {
        role: 'USER',
        partnerId: null
      }
    });

    res.json({ message: 'Rescuer removed successfully' });
  } catch (error) {
    console.error('Error removing rescuer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get full profile details (including role-specific and partner details)
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partner: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude password and tokens
    const { password: _, refreshToken: __, ...userProfile } = user;

    // Fetch additional role-specific stats
    let stats = {};
    let registrationDetails = null;

    if (user.role === 'VET' && user.partnerId) {
      // Vet specific stats
      const [totalRescues, successfulAdoptions, activeCampaigns, regDoc] = await Promise.all([
        prisma.animalReport.count({ where: { assignedPartnerId: user.partnerId } }),
        prisma.pet.count({ where: { partnerId: user.partnerId, status: 'ADOPTED' } }),
        prisma.campaign.count({ where: { partnerId: user.partnerId, status: 'ACTIVE' } }),
        prisma.petDocument.findFirst({
          where: { userId: user.id, type: 'REGISTRATION' }
        })
      ]);

      stats = { totalRescues, successfulAdoptions, activeCampaigns };

      if (regDoc && regDoc.fileData) {
        try {
          registrationDetails = JSON.parse(regDoc.fileData);
        } catch (_e) {
          registrationDetails = { registrationNumber: regDoc.fileData };
        }
      }
    } else if (user.role === 'NGO') {
      // NGO specific stats (e.g. campaigns created, reports created/assigned)
      const [totalRescues, activeCampaigns, regDoc] = await Promise.all([
        prisma.animalReport.count({ where: { reporterId: user.id } }), // reports created by them or assigned
        prisma.campaign.count({ where: { createdBy: user.id, status: 'ACTIVE' } }),
        prisma.petDocument.findFirst({
          where: { userId: user.id, type: 'REGISTRATION' }
        })
      ]);

      stats = { totalRescues, activeCampaigns };

      if (regDoc && regDoc.fileData) {
        try {
          registrationDetails = JSON.parse(regDoc.fileData);
        } catch (_e) {
          registrationDetails = { registrationNumber: regDoc.fileData };
        }
      }
    }

    res.json({
      user: userProfile,
      stats,
      registrationDetails
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Request OTP to upgrade role to RESCUER
 * @route POST /api/users/upgrade-rescuer/request-otp
 * @access Private (USER)
 */
const requestRescuerUpgradeOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'USER') {
      return res.status(400).json({ error: 'Only USER role can request this upgrade' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailOtp: otp,
        emailOtpExpiry: otpExpiry
      }
    });

    console.log(`[DEV OTP] Rescuer Upgrade OTP for ${user.email} is: ${otp}`);

    await sendEmail({
      to: user.email,
      subject: 'Your OTP for Rescuer Upgrade - StrayCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #c93b2b; text-align: center;">Rescuer Role Upgrade</h2>
          <p>Dear ${user.name},</p>
          <p>You have requested to upgrade your account to a <strong>RESCUER</strong>.</p>
          <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; padding: 10px 20px; background-color: #f9f9f9; border-radius: 4px; border: 1px dashed #ccc;">${otp}</span>
          </div>
          <p>This OTP is valid for 10 minutes. Do not share this with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 0.85rem; color: #888; text-align: center;">Best regards,<br/>The StrayCare Team</p>
        </div>
      `
    }).catch(err => console.error('Failed to send OTP email:', err));

    res.json({ message: 'OTP sent to your email successfully' });
  } catch (error) {
    console.error('Error requesting rescuer upgrade OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Verify OTP and upgrade role to RESCUER
 * @route POST /api/users/upgrade-rescuer/verify-otp
 * @access Private (USER)
 */
const verifyRescuerUpgradeOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'USER') {
      return res.status(400).json({ error: 'Only USER role can perform this upgrade' });
    }

    if (!user.emailOtp || user.emailOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.emailOtpExpiry)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'RESCUER',
        emailOtp: null,
        emailOtpExpiry: null
      }
    });

    // Generate new token with updated role
    const token = generateToken(updatedUser.id, updatedUser.role);

    res.json({ 
      message: 'Role upgraded successfully',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error verifying rescuer upgrade OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Save or update the FCM token for a user
 * @route POST /api/users/fcm-token
 * @access Private
 */
const saveFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM Token is required' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken }
    });

    res.json({ message: 'FCM Token saved successfully' });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update or create independent rescuer location
 * @route POST /api/users/rescuer-location
 * @access Private
 */
const updateRescuerLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const updated = await prisma.generalVolunteer.upsert({
      where: { userId },
      update: { lat: parseFloat(lat), lng: parseFloat(lng) },
      create: {
        userId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        status: 'ACTIVE'
      }
    });

    res.json({ message: 'Location updated successfully', location: updated });
  } catch (error) {
    console.error('Error updating rescuer location:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getClinicRescuers,
  addRescuer,
  removeRescuer,
  getProfile,
  requestRescuerUpgradeOtp,
  verifyRescuerUpgradeOtp,
  saveFcmToken,
  updateRescuerLocation
};
