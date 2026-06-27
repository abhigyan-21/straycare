const prisma = require('../../db/prisma');

/**
 * @desc Get public partner profile along with aggregated stats and campaigns
 * @route GET /api/partners/:id/public
 * @access Public
 */
const getPublicPartnerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch partner basic details
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        partnerType: true,
        city: true,
        state: true,
        verificationStatus: true,
        createdAt: true,
        lat: true,
        lng: true,
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Fetch campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { partnerId: id },
      orderBy: { createdAt: 'desc' }
    });

    let totalCreated = campaigns.length;
    let totalCompleted = 0;
    let fundsRaised = 0;

    const activeCampaigns = [];
    const completedCampaigns = [];

    campaigns.forEach(c => {
      // Aggregate Funds Raised
      if (c.raisedAmount) {
        fundsRaised += parseFloat(c.raisedAmount.toString());
      }

      // Check Status
      if (c.status === 'COMPLETED') {
        totalCompleted++;
        completedCampaigns.push(c);
      } else if (c.status === 'ACTIVE' || c.status === 'URGENT') {
        activeCampaigns.push(c);
      }
    });

    res.json({
      partner,
      stats: {
        totalCreated,
        totalCompleted,
        fundsRaised,
      },
      campaigns: {
        active: activeCampaigns,
        completed: completedCampaigns
      }
    });

  } catch (error) {
    console.error('Error fetching public partner profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all public verified partners
 * @route GET /api/partners
 * @access Public
 */
const getAllPublicPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        verificationStatus: 'VERIFIED'
      },
      select: {
        id: true,
        name: true,
        partnerType: true,
        city: true,
        state: true,
        address: true,
        users: {
          select: {
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedPartners = partners.map(p => {
      // Find a user with an avatar, or fallback
      const userWithAvatar = p.users.find(u => u.avatarUrl && u.avatarUrl.length > 10);
      const avatar = userWithAvatar ? userWithAvatar.avatarUrl : null;
      
      return {
        id: p.id,
        name: p.name,
        type: p.partnerType,
        location: p.city && p.state ? `${p.city}, ${p.state}` : (p.address || "Location Unspecified"),
        logo: avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      };
    });

    res.json(formattedPartners);
  } catch (error) {
    console.error('Error fetching all public partners:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getPublicPartnerProfile,
  getAllPublicPartners
};
