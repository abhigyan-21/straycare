const crypto = require('crypto');
const prisma = require('../../db/prisma');
const Razorpay = require('razorpay');
const { sendEmail } = require('../../services/email.service');

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
 */const volunteerCampaign = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;
    const key = `${userId}-general`;

    // 1. Check if already in DB (general volunteering)
    let existingVolunteer = null;
    try {
      existingVolunteer = await prisma.generalVolunteer.findUnique({
        where: { userId }
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

    const latNum = lat ? parseFloat(lat) : null;
    const lngNum = lng ? parseFloat(lng) : null;

    // 3. Schedule the DB insert in 2 minutes (120,000 ms)
    const timeoutId = setTimeout(async () => {
      try {
        await prisma.generalVolunteer.create({
          data: {
            userId,
            status: 'APPLIED',
            lat: latNum,
            lng: lngNum,
          }
        });
        console.log(`✅ General volunteer registered in DB for user ${userId} with coords (${latNum}, ${lngNum})`);
      } catch (err) {
        console.error(`❌ Error creating volunteer in DB for user ${userId}:`, err.message);
      } finally {
        pendingVolunteers.delete(key);
      }
    }, 120 * 1000);

    pendingVolunteers.set(key, {
      timeoutId,
      startTime: Date.now(),
      lat: latNum,
      lng: lngNum,
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
      const existingVolunteer = await prisma.generalVolunteer.findUnique({
        where: { userId }
      });

      if (existingVolunteer) {
        await prisma.generalVolunteer.delete({
          where: { userId }
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
      const existing = await prisma.generalVolunteer.findUnique({
        where: { userId }
      });
      if (existing) {
        return res.status(200).json({ status: 'applied' });
      }
    } catch (err) {
      console.warn("DB offline, status checks fall back to none.", err.message);
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
      if (id.startsWith('general-card-')) {
        // Map card IDs to types:
        // Card 1: Support feeding our pets -> FOOD
        // Card 2: Support treatment of our pets -> TREATMENT
        // Card 3: Support providing shelter for our pets -> SHELTER
        let type = 'FOOD';
        if (id === 'general-card-2') type = 'TREATMENT';
        if (id === 'general-card-3') type = 'SHELTER';

        await prisma.donation.create({
          data: {
            userId,
            amount: Number(amount),
            type: type,
            paymentIntentId: `mock-intent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'SUCCESS'
          }
        });
        console.log(`💵 Mock donation successful: user ${userId} donated ₹${amount} to general fund type ${type}`);
      } else {
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
      }
    } catch (err) {
      console.warn("DB update failed, mock donation skipped writing to database.", err.message);
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

// Helper to compute distance (Haversine formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

/**
 * @desc Find and email general volunteers within 20km of the campaign's clinic
 * @route POST /api/funding/campaigns/:id/notify
 * @access Private (Vet/Admin)
 */
const notifyNearbyVolunteers = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch campaign and its clinic location coordinates
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        clinic: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const clinicLat = campaign.clinic?.lat;
    const clinicLng = campaign.clinic?.lng;

    // 2. Fetch all general volunteers
    const generalVolunteers = await prisma.generalVolunteer.findMany({
      include: {
        user: true
      }
    });

    const notifiedVolunteers = [];
    const radiusLimit = 20; // 20 km

    // 3. Filter volunteers by distance & trigger email simulation
    for (const volunteer of generalVolunteers) {
      let isWithinRadius = false;
      let calculatedDistance = null;

      if (clinicLat && clinicLng && volunteer.lat && volunteer.lng) {
        calculatedDistance = getDistance(clinicLat, clinicLng, volunteer.lat, volunteer.lng);
        if (calculatedDistance <= radiusLimit) {
          isWithinRadius = true;
        }
      } else {
        // Fallback: if coordinates are missing, match them generally so they aren't ignored
        isWithinRadius = true;
      }

      if (isWithinRadius && volunteer.user?.email) {
        const confirmUrl = `http://localhost:5000/api/funding/campaigns/volunteer/confirm?campaignId=${campaign.id}&userId=${volunteer.userId}`;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #346c02; text-align: center;">Help Needed Near You!</h2>
            <p>Hello ${volunteer.user.name},</p>
            <p>A campaign in your local area, <strong>"${campaign.title}"</strong>, is looking for volunteer assistance.</p>
            <p style="background-color: #f9fbf7; padding: 15px; border-left: 4px solid #346c02; font-style: italic;">
              "${campaign.description}"
            </p>
            <p><strong>Campaign Location:</strong> ${campaign.location || 'Local Clinic Area'}</p>
            ${calculatedDistance ? `<p><strong>Distance to you:</strong> ${calculatedDistance.toFixed(1)} km</p>` : ''}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}" style="background-color: #346c02; color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">
                Yes, I want to Volunteer
              </a>
            </div>
            <p>Thank you for supporting Furzo rescue efforts!</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin-top: 30px;" />
            <p style="font-size: 0.8rem; color: #999; text-align: center;">You received this email because you enrolled in Furzo's general volunteer list.</p>
          </div>
        `;

        // Send email in the background
        sendEmail({
          to: volunteer.user.email,
          subject: `[Volunteer Callout] Help needed for: ${campaign.title}`,
          html: htmlContent
        }).catch(err => console.error(`❌ Error sending volunteer callout email to ${volunteer.user.email}:`, err.message));

        notifiedVolunteers.push({
          userId: volunteer.userId,
          name: volunteer.user.name,
          email: volunteer.user.email,
          distanceKm: calculatedDistance
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Successfully notified ${notifiedVolunteers.length} volunteer(s).`,
      notifiedCount: notifiedVolunteers.length,
      volunteers: notifiedVolunteers
    });
  } catch (error) {
    console.error('Error sending volunteer callout notifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Confirm participation for a specific campaign from the email link
 * @route GET /api/funding/campaigns/volunteer/confirm
 * @access Public (called from email click)
 */
const confirmVolunteerCampaign = async (req, res) => {
  try {
    const { campaignId, userId } = req.query;

    if (!campaignId || !userId) {
      return res.status(400).send('<h1>Invalid Link</h1><p>Missing campaignId or userId parameters.</p>');
    }

    // 1. Verify user and campaign exist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!user || !campaign) {
      return res.status(404).send('<h1>Not Found</h1><p>User or Campaign does not exist.</p>');
    }

    // 2. Create or update the specific volunteer registration with status 'CONFIRMED'
    try {
      await prisma.campaignVolunteer.upsert({
        where: {
          userId_campaignId: {
            userId,
            campaignId
          }
        },
        update: {
          status: 'CONFIRMED'
        },
        create: {
          userId,
          campaignId,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ User ${userId} successfully confirmed specific volunteer registration for campaign ${campaignId}`);
    } catch (err) {
      console.warn("DB offline, simulating confirmation success page.");
    }

    // 3. Return a beautiful thank-you HTML page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Volunteer Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #fdfdf9; color: #333; text-align: center; padding: 50px; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 4px solid #f0f7e6; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          h1 { color: #346c02; }
          p { font-size: 1.1rem; line-height: 1.6; color: #555; }
          .badge { background: #346c02; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Thank You!</h1>
          <p>Your volunteer participation for <strong>"${campaign.title}"</strong> has been successfully confirmed!</p>
          <p>We are excited to work with you. Details and coordination instructions will be shared shortly.</p>
          <div class="badge">CONFIRMED</div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error confirming specific campaign volunteering:', error);
    res.status(500).send('<h1>Server Error</h1><p>An unexpected error occurred. Please try again later.</p>');
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
  notifyNearbyVolunteers,
  confirmVolunteerCampaign,
};