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

module.exports = {
  getPublicPartnerProfile
};
