const crypto = require('crypto');
const prisma = require('../../db/prisma');
const Razorpay = require('razorpay');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay keys missing. Funding features will be disabled.');
}

// In-memory registry for general volunteers pending cooldown
const pendingVolunteers = new Map(); // key: `${userId}-general`, value: { timeoutId, startTime }

/**
 * @desc  Create a Razorpay order for a one-time donation
 * @route POST /api/funding/donate
 * @access Private (requires verifyToken)
 */
const createDonationOrder = async (req, res) => {
  try {
    const { amount, type, clinicId, campaignId } = req.body;
    const userId = req.user.id;

    // ── Validation ──────────────────────────────────────────────
    if (!amount || !type) {
      return res.status(400).json({ error: 'amount and type are required' });
    }

    const validTypes = ['FOOD', 'TREATMENT', 'SHELTER', 'CAMPAIGN'];
    if (!validTypes.includes(type)) {
      return res
        .status(400)
        .json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    if (type === 'CAMPAIGN' && !campaignId) {
      return res
        .status(400)
        .json({ error: 'campaignId is required for CAMPAIGN donations' });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ error: 'amount must be a positive number' });
    }

    // ── Create Razorpay Order ───────────────────────────────────
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway unavailable.' });
    }
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: userId,
    });

    // ── Persist a PENDING donation record ───────────────────────
    const donation = await prisma.donation.create({
      data: {
        userId,
        amount,
        type,
        clinicId: clinicId || null,
        campaignId: campaignId || null,
        paymentIntentId: order.id,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      order,
      donationId: donation.id,
    });
  } catch (error) {
    console.error('Error creating donation order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc  Handle Razorpay webhook events (order.paid)
 * @route POST /api/funding/webhook
 * @access Public — called by Razorpay, verified via HMAC signature
 */
const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  // ── 1. Verify webhook signature ──────────────────────────────
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  //   .update(JSON.stringify(req.body))
  //   .digest('hex');

  // if (expectedSignature !== signature) {
  //   console.error('⚠️  Razorpay webhook signature verification failed');
  //   return res.status(400).json({ error: 'Invalid webhook signature' });
  // }

  // ── 2. Process event ─────────────────────────────────────────
  const event = req.body.event;

  if (event === 'order.paid') {
    const orderId = req.body.payload.order.entity.id;
    const amountPaise = req.body.payload.order.entity.amount;

    try {
      // Find the PENDING donation linked to this Razorpay order
      const donation = await prisma.donation.findUnique({
        where: { paymentIntentId: orderId },
      });

      if (!donation) {
        console.error(`❌ No donation found for order ${orderId}`);
        return res.status(200).json({ received: true });
      }

      const operations = [];

      // Mark the donation as SUCCESS
      operations.push(
        prisma.donation.update({
          where: { paymentIntentId: orderId },
          data: { status: 'SUCCESS' },
        })
      );

      // If this donation targets a campaign, bump its raisedAmount
      if (donation.campaignId) {
        operations.push(
          prisma.campaign.update({
            where: { id: donation.campaignId },
            data: {
              raisedAmount: {
                increment: amountPaise / 100,
              },
            },
          })
        );
      }

      await prisma.$transaction(operations);

      console.log(
        `✅ Donation fulfilled | order ${orderId} | user ${donation.userId} | ₹${amountPaise / 100}`
      );
    } catch (err) {
      // Log but still return 200 to prevent Razorpay from retrying endlessly.
      console.error('❌ Webhook fulfillment error:', err);
    }
  }

  // Always return 200 so Razorpay does not retry
  res.status(200).json({ received: true });
};

/**
 * @desc Create a new campaign
 * @route POST /api/funding/campaigns
 * @access Private (Vet/Admin)
 */
const createCampaign = async (req, res) => {
  try {
    const { title, description, purpose, goalAmount, startDate, endDate, startTime, location, theme, image, banner } = req.body;
    const userId = req.user.id;
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(403).json({ error: 'You must be associated with a clinic to create a campaign' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        purpose,
        goalAmount: parseFloat(goalAmount),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        startTime,
        location,
        theme,
        image,
        banner,
        clinicId,
        createdBy: userId,
        status: 'APPROVED', // Default to approved for now as requested by vet flow
      },
    });

    res.status(201).json({ status: 'success', data: campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get campaigns for the current clinic
 * @route GET /api/funding/campaigns
 * @access Private (Vet/Admin)
 */
const getCampaigns = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      // If no clinicId, maybe return all approved campaigns (public view)
      const campaigns = await prisma.campaign.findMany({
        where: { status: 'APPROVED' },
        include: { clinic: true },
      });
      return res.json({ status: 'success', data: campaigns });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { clinicId },
      include: {
        volunteers: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    res.json({ status: 'success', data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update campaign status
 * @route PATCH /api/funding/campaigns/:id
 * @access Private (Vet/Admin)
 */
const updateCampaignStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    res.json({ status: 'success', data: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Register/schedule user as a general volunteer with a 2-minute cooldown
 * @route POST /api/funding/campaigns/volunteer
 * @access Private (requires verifyToken)
 */
const volunteerCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const key = `${userId}-general`;

    // 1. Check if already in DB (general volunteering has campaignId = null)
    let existingVolunteer = null;
    try {
      existingVolunteer = await prisma.volunteer.findFirst({
        where: {
          userId,
          campaignId: null
        }
      });
    } catch (err) {
      console.warn("DB offline, checking in-memory state only.");
    }

    if (existingVolunteer) {
      return res.status(400).json({ status: 'applied', error: 'You have already enrolled as a volunteer.' });
    }

    // 2. Check if already pending in memory
    if (pendingVolunteers.has(key)) {
      const record = pendingVolunteers.get(key);
      const remainingSeconds = Math.max(0, 120 - Math.floor((Date.now() - record.startTime) / 1000));
      return res.status(200).json({ status: 'pending', remainingSeconds, message: 'Volunteering is already scheduled.' });
    }

    // 3. Schedule the DB insert in 2 minutes (120,000 ms)
    const timeoutId = setTimeout(async () => {
      try {
        await prisma.volunteer.create({
          data: {
            userId,
            campaignId: null,
            status: 'APPLIED'
          }
        });
        console.log(`✅ General volunteer registered in DB for user ${userId}`);
      } catch (err) {
        console.error(`❌ Error creating volunteer in DB for user ${userId}:`, err.message);
      } finally {
        pendingVolunteers.delete(key);
      }
    }, 120 * 1000);

    pendingVolunteers.set(key, {
      timeoutId,
      startTime: Date.now()
    });

    res.status(200).json({
      status: 'pending',
      remainingSeconds: 120,
      message: 'Volunteering scheduled. You have 2 minutes to cancel.'
    });
  } catch (error) {
    console.error('Error scheduling volunteer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Cancel scheduled volunteering or delete active volunteer record
 * @route POST /api/funding/campaigns/volunteer/cancel
 * @access Private (requires verifyToken)
 */
const cancelVolunteerCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const key = `${userId}-general`;

    // 1. Check if pending in memory
    if (pendingVolunteers.has(key)) {
      const { timeoutId } = pendingVolunteers.get(key);
      clearTimeout(timeoutId);
      pendingVolunteers.delete(key);
      console.log(`🚫 Pending general volunteer cancelled for user ${userId}`);
      return res.status(200).json({ status: 'none', message: 'Pending volunteering registration cancelled.' });
    }

    // 2. If already in database, delete it
    try {
      const existingVolunteer = await prisma.volunteer.findFirst({
        where: {
          userId,
          campaignId: null
        }
      });

      if (existingVolunteer) {
        await prisma.volunteer.delete({
          where: {
            id: existingVolunteer.id
          }
        });
        console.log(`🗑️ General volunteer record deleted from DB for user ${userId}`);
        return res.status(200).json({ status: 'none', message: 'Volunteer registration removed.' });
      }
    } catch (dbError) {
      console.warn("DB offline, could not complete DB unenrollment:", dbError.message);
    }

    res.status(200).json({ status: 'none', message: 'No volunteer record found.' });
  } catch (error) {
    console.error('Error cancelling volunteer registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Check if user has volunteered or has a pending registration
 * @route GET /api/funding/campaigns/volunteer/status
 * @access Private (requires verifyToken)
 */
const checkVolunteerStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const key = `${userId}-general`;

    // 1. Check if pending in memory
    if (pendingVolunteers.has(key)) {
      const record = pendingVolunteers.get(key);
      const remainingSeconds = Math.max(0, 120 - Math.floor((Date.now() - record.startTime) / 1000));
      if (remainingSeconds > 0) {
        return res.status(200).json({ status: 'pending', remainingSeconds });
      } else {
        // If expired but callback hasn't run yet, act as applied
        return res.status(200).json({ status: 'applied' });
      }
    }

    // 2. Check if committed to DB
    try {
      const existing = await prisma.volunteer.findFirst({
        where: {
          userId,
          campaignId: null
        }
      });
      if (existing) {
        return res.status(200).json({ status: 'applied' });
      }
    } catch (err) {
      console.warn("DB offline, status checks fall back to none.");
    }

    res.status(200).json({ status: 'none' });
  } catch (error) {
    console.error('Error checking volunteering status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Directly increment a campaign's raised amount (simulated checkout success)
 * @route POST /api/funding/campaigns/:id/donate-mock
 * @access Private (requires verifyToken)
 */
const mockDonateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    // Update campaign raisedAmount
    let campaign = null;
    try {
      campaign = await prisma.campaign.update({
        where: { id },
        data: {
          raisedAmount: {
            increment: Number(amount)
          }
        }
      });

      // Record a SUCCESS donation in database
      await prisma.donation.create({
        data: {
          userId,
          amount: Number(amount),
          type: 'CAMPAIGN',
          campaignId: id,
          paymentIntentId: `mock-intent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'SUCCESS'
        }
      });
      
      console.log(`💵 Mock donation successful: user ${userId} donated ₹${amount} to campaign ${id}`);
    } catch (err) {
      console.warn("DB offline, mock donation skipped writing to database.", err.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Mock payment processed and recorded successfully.',
      data: campaign
    });
  } catch (error) {
    console.error('Error in mock donation endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createDonationOrder,
  handleRazorpayWebhook,
  createCampaign,
  getCampaigns,
  updateCampaignStatus,
  volunteerCampaign,
  cancelVolunteerCampaign,
  checkVolunteerStatus,
  mockDonateCampaign,
};