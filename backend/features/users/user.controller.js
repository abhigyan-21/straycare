const prisma = require('../../db/prisma');

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
        } catch (e) {
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
        } catch (e) {
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

module.exports = {
  getClinicRescuers,
  addRescuer,
  removeRescuer,
  getProfile
};
