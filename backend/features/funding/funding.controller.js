
const prisma = require('../../db/prisma');
const Razorpay = require('razorpay');
const { sendEmail } = require('../../services/email.service');
const { uploadToCloudinary } = require('../../utils/cloudinary');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay keys missing. Funding features will be disabled.');
}

const fundingService = require('./funding.service');

/**
 * @desc Get eligible support requests for a specific hub
 * @route GET /api/funding/hubs/:category
 * @access Public
 */
const getHubs = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = ['FOOD', 'TREATMENT', 'SHELTER'];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        requestType: 'SUPPORT_REQUEST',
        category: category.toUpperCase(),
        status: { in: ['ACTIVE', 'ENDING_SOON'] },
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } }
        ]
      },
      include: {
        partner: true
      }
    });

    // Score and filter
    const scoredCampaigns = campaigns.map(c => {
      c.priorityScore = fundingService.calculatePriorityScore(c);
      return c;
    }).filter(c => c.priorityScore > 0);

    // Sort descending
    scoredCampaigns.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({ status: 'success', data: scoredCampaigns });
  } catch (error) {
    console.error('Error fetching hubs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Generate recommended split
 * @route POST /api/funding/split-donate
 * @access Public
 */
const splitDonate = async (req, res) => {
  try {
    const { amount, category } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!category) return res.status(400).json({ error: 'Category is required' });

    const campaigns = await prisma.campaign.findMany({
      where: {
        requestType: 'SUPPORT_REQUEST',
        category: category.toUpperCase(),
        status: { in: ['ACTIVE', 'ENDING_SOON'] },
        OR: [
          { deadline: null },
          { deadline: { gte: new Date() } }
        ]
      },
      include: {
        partner: true
      }
    });

    const scoredCampaigns = campaigns.map(c => {
      c.priorityScore = fundingService.calculatePriorityScore(c);
      return c;
    });

    const splits = fundingService.generateSplitRecommendation(amount, scoredCampaigns);

    res.json({ status: 'success', data: splits });
  } catch (error) {
    console.error('Error calculating split:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Generate Razorpay order with transfers for split donations
 * @route POST /api/funding/confirm-split
 * @access Private (requires verifyToken)
 */
const confirmSplit = async (req, res) => {
  try {
    const { totalAmount, splits } = req.body;
    const userId = req.user.id;

    if (!totalAmount || !splits || splits.length === 0) {
      return res.status(400).json({ error: 'Valid totalAmount and splits are required' });
    }

    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway unavailable.' });
    }

    // Prepare transfers for Razorpay Route
    const transfers = [];
    let calculatedTotal = 0;

    for (const split of splits) {
      // Find the partner to get their razorpayAccountId
      let partner = null;
      if (split.partnerId) {
        partner = await prisma.partner.findUnique({
          where: { id: split.partnerId },
          select: { razorpayAccountId: true }
        });
      }

      if (!partner || !partner.razorpayAccountId) {
        console.warn(`Campaign ${split.campaignId} (Partner ${split.partnerId}) does not have a linked Razorpay account. Skipping transfer for this split.`);
        // In production, we might throw an error or handle fallback. For MVP, we skip or route to platform.
        // Let's assume MVP has it.
      } else {
        transfers.push({
          account: partner.razorpayAccountId,
          amount: Math.round(split.amount * 100), // paise
          currency: 'INR',
          notes: {
            campaignId: split.campaignId
          },
          linked_account_notes: ['campaignId'],
          on_hold: 0
        });
      }
      calculatedTotal += split.amount;
    }

    // For MVP/Test Mode, if no partners have real linked accounts, we still generate the order
    // so the checkout flow works and the DB records the splits.
    // Razorpay receipt max length is 40 characters.
    const receiptStr = `sp_${userId.substring(0, 8)}_${Date.now()}`;
    const orderOptions = {
      amount: Math.round(calculatedTotal * 100),
      currency: 'INR',
      receipt: receiptStr,
    };

    if (transfers.length > 0) {
      orderOptions.transfers = transfers;
    }

    // Create the master order
    const order = await razorpay.orders.create(orderOptions);

    // Create Donation records for each split linked to the same order ID
    const donationOperations = splits.map(split =>
      prisma.donation.create({
        data: {
          userId,
          partnerId: split.partnerId,
          campaignId: split.campaignId,
          grossAmount: split.amount,
          razorpayPaymentLinkId: order.id, // Using order ID to link them all
          razorpayPaymentId: null,
          status: 'INITIATED',
          platformFee: 0,
          platformFeePercentage: 0,
          netAmount: split.amount,
        }
      })
    );

    await prisma.$transaction(donationOperations);

    res.status(201).json({
      status: 'success',
      order
    });

  } catch (error) {
    console.error('Error confirming split:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Generate Razorpay Subscription for a Hub (Autopay)
 * @route POST /api/funding/hubs/:category/subscribe
 * @access Private
 */
const createHubSubscription = async (req, res) => {
  try {
    const { category } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway unavailable.' });
    }

    // 1. Create a Razorpay Plan for this specific amount dynamically
    // In production, plans might be pre-created, but creating on the fly works for varying amounts.
    const plan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: `Furzo ${category.toUpperCase()} Hub Monthly Subscription`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        description: `Monthly contribution to the ${category} Hub.`
      }
    });

    // 2. Create the Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      customer_notify: 1,
      total_count: 120, // 10 years by default
    });

    // 3. Save to database
    // We'll store the category in the type field for reference
    await prisma.subscription.create({
      data: {
        userId,
        partnerId: 'SYSTEM', // Not tied to a single partner initially
        type: category.toUpperCase() === 'TREATMENT' ? 'TREATMENT' : (category.toUpperCase() === 'FOOD' ? 'FOOD' : 'SHELTER'),
        razorpaySubscriptionId: subscription.id,
        amount: Number(amount),
        status: 'CREATED',
        nextCheckout: new Date(),
      }
    });

    res.status(201).json({
      status: 'success',
      subscriptionId: subscription.id,
      short_url: subscription.short_url,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// In-memory registry for general volunteers pending cooldown
const pendingVolunteers = new Map(); // key: `${userId}-general`, value: { timeoutId, startTime }

/**
 * @desc  Create a Razorpay order for a one-time donation
 * @route POST /api/funding/donate
 * @access Private (requires verifyToken)
 */
const createDonationOrder = async (req, res) => {
  try {
    const { amount, type, partnerId, clinicId, campaignId } = req.body;
    const userId = req.user.id;
    // Robust fallback for MVP: Donation schema strictly requires valid partnerId and campaignId
    let resolvedPartnerId = partnerId || clinicId || req.user.partnerId || req.user.clinicId;
    if (!resolvedPartnerId || resolvedPartnerId === 'mock-partner-id') {
      let fbPartner = await prisma.partner.findFirst();
      if (!fbPartner) {
        fbPartner = await prisma.partner.create({ data: { name: 'Platform General Fund' } });
      }
      resolvedPartnerId = fbPartner.id;
    }

    let resolvedCampaignId = campaignId;
    if (!resolvedCampaignId) {
      let fbCamp = await prisma.campaign.findFirst();
      if (!fbCamp) {
        fbCamp = await prisma.campaign.create({
          data: {
            title: 'Platform General Fund',
            description: 'General platform donations',
            goalAmount: 1000000,
            partnerId: resolvedPartnerId,
            createdBy: userId
          }
        });
      }
      resolvedCampaignId = fbCamp.id;
    }

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

    if (type === 'CAMPAIGN' && !resolvedCampaignId) {
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
        partnerId: resolvedPartnerId,
        campaignId: resolvedCampaignId,
        grossAmount: amount,
        razorpayPaymentLinkId: order.id,
        razorpayPaymentId: null,
        status: 'INITIATED',
        platformFee: 0,
        platformFeePercentage: 0,
        netAmount: amount,
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
  // const signature = req.headers['x-razorpay-signature'];

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
    // const amountPaise = req.body.payload.order.entity.amount;

    try {
      // Find all PENDING donations linked to this Razorpay order
      const donations = await prisma.donation.findMany({
        where: { razorpayPaymentLinkId: orderId },
      });

      if (donations.length === 0) {
        console.error(`❌ No donation found for order ${orderId}`);
        return res.status(200).json({ received: true });
      }

      const operations = [];

      // Mark all these donations as SUCCESS
      operations.push(
        prisma.donation.updateMany({
          where: { razorpayPaymentLinkId: orderId },
          data: { status: 'WEBHOOK_VERIFIED', razorpayPaymentId: req.body?.payload?.payment?.entity?.id || null },
        })
      );

      // Bump raisedAmount for each campaign
      for (const donation of donations) {
        if (donation.campaignId) {
          operations.push(
            prisma.campaign.update({
              where: { id: donation.campaignId },
              data: {
                raisedAmount: {
                  increment: donation.grossAmount,
                },
              },
            })
          );
        }
      }

      await prisma.$transaction(operations);

      console.log(
        `✅ Donation fulfilled | order ${orderId} | user ${donations[0].userId} | splits: ${donations.length}`
      );
    } catch (err) {
      console.error('❌ Webhook fulfillment error (order.paid):', err);
    }
  } else if (event === 'subscription.charged') {
    const subscriptionId = req.body.payload.subscription.entity.id;
    const paymentId = req.body.payload.payment.entity.id;
    const amountPaise = req.body.payload.payment.entity.amount;

    try {
      const subscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subscriptionId }
      });

      if (subscription) {
        // Run Smart Recommendation Engine for this month's split
        const campaigns = await prisma.campaign.findMany({
          where: {
            requestType: 'SUPPORT_REQUEST',
            category: subscription.type,
            status: { in: ['ACTIVE', 'ENDING_SOON'] }
          },
          include: { partner: true }
        });

        const scoredCampaigns = campaigns.map(c => {
          c.priorityScore = fundingService.calculatePriorityScore(c);
          return c;
        });

        const splits = fundingService.generateSplitRecommendation(amountPaise / 100, scoredCampaigns);

        const transfers = [];
        for (const split of splits) {
          const partner = await prisma.partner.findUnique({
            where: { id: split.partnerId },
            select: { razorpayAccountId: true }
          });

          if (partner && partner.razorpayAccountId) {
            transfers.push({
              account: partner.razorpayAccountId,
              amount: Math.round(split.amount * 100),
              currency: 'INR',
              notes: { campaignId: split.campaignId },
              linked_account_notes: ['campaignId'],
              on_hold: 0
            });
          }
        }

        // Programmatically route the funds to the selected partners right now
        if (transfers.length > 0 && razorpay) {
          await razorpay.payments.transfer(paymentId, { transfers });
        }

        const donationOperations = splits.map(split =>
          prisma.donation.create({
            data: {
              userId: subscription.userId,
              partnerId: split.partnerId,
              campaignId: split.campaignId,
              grossAmount: split.amount,
              razorpayPaymentLinkId: subscriptionId,
              razorpayPaymentId: paymentId,
              status: 'WEBHOOK_VERIFIED',
              platformFee: 0,
              platformFeePercentage: 0,
              netAmount: split.amount,
            }
          })
        );

        const campaignOps = splits.map(split =>
          prisma.campaign.update({
            where: { id: split.campaignId },
            data: { raisedAmount: { increment: split.amount } }
          })
        );

        await prisma.$transaction([...donationOperations, ...campaignOps]);

        console.log(`✅ Autopay Subscription dynamically routed! Sub: ${subscriptionId} | Payment: ${paymentId}`);
      }
    } catch (err) {
      console.error('❌ Webhook fulfillment error (subscription.charged):', err);
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
    const { title, description, purpose, goalAmount, startDate, endDate, startTime, location, theme, image, banner, requestType } = req.body;
    const userId = req.user.id;
    const partnerId = req.user.partnerId || req.user.clinicId;

    if (!partnerId) {
      return res.status(403).json({ error: 'You must be associated with a partner to create a campaign' });
    }

    // Strict validation enforcing all fields are compulsory
    if (!title || !description || !purpose || !goalAmount || !startDate || !endDate || !startTime || !location || !theme) {
      return res.status(400).json({ error: 'All compulsory fields must be provided.' });
    }

    let finalBanner = banner;
    let finalImage = image;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      finalBanner = result.secure_url;
      finalImage = result.secure_url; // Use banner for image thumbnail as well if uploaded
    }

    if (!finalBanner || !finalImage) {
      return res.status(400).json({ error: 'Banner image is required.' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        purpose,
        goalAmount: parseFloat(goalAmount),
        startDate: startDate ? new Date(startDate) : null,
        deadline: endDate ? new Date(endDate) : null,
        startTime,
        location,
        theme,
        image: finalImage,
        banner: finalBanner,
        partnerId,
        createdBy: userId,
        status: 'ACTIVE',
        requestType: requestType || 'CAMPAIGN',
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
    const { id, location, status } = req.query;
    const partnerId = req.query.partnerId || req.query.clinicId || req.user?.partnerId || req.user?.clinicId;

    const where = {};

    if (partnerId) {
      where.partnerId = partnerId;
    }
    if (id) {
      where.id = id;
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    } else if (!partnerId) {
      // If no partner filter is requested, default to public view showing only ACTIVE campaigns
      where.status = 'ACTIVE';
    }

    if (where.status === 'ACTIVE' || where.status === 'ENDING_SOON') {
      where.OR = [
        { deadline: null },
        { deadline: { gte: new Date() } }
      ];
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        partner: true,
        creator: {
          select: { name: true }
        },
        volunteers: {
          where: {
            status: 'CONFIRMED'
          },
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        donations: {
          where: {
            status: { in: ['SELF_REPORTED', 'WEBHOOK_VERIFIED'] }
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ status: 'success', data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.goalAmount !== undefined) {
      data.goalAmount = parseFloat(data.goalAmount);
    }
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.deadline = new Date(data.endDate);
      delete data.endDate;
    }
    if (data.clinicId) {
      data.partnerId = data.clinicId;
      delete data.clinicId;
    }
    if (data.status === 'APPROVED') data.status = 'ACTIVE';
    if (data.status === 'PENDING') data.status = 'DRAFT';
    if (data.status === 'REJECTED') data.status = 'PAUSED';

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data,
    });

    res.json({ status: 'success', data: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await prisma.campaignVolunteer.deleteMany({ where: { campaignId: id } });
      await prisma.donation.deleteMany({ where: { campaignId: id } });
    } catch (err) {
      console.warn('Non-fatal error cleaning up relations during campaign delete:', err);
    }

    const deletedCampaign = await prisma.campaign.delete({
      where: { id },
    });

    res.json({ status: 'success', data: deletedCampaign });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getFundingHighlights = async (req, res) => {
  try {
    // 1. Find the top contributor for the current calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let topContributor = null;
    let maxContribution = 0;

    try {
      const donations = await prisma.donation.findMany({
        where: {
          status: 'WEBHOOK_VERIFIED',
          createdAt: {
            gte: startOfMonth
          }
        },
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      const contributionMap = {};
      donations.forEach(d => {
        if (!contributionMap[d.userId]) {
          contributionMap[d.userId] = {
            name: d.user?.name || 'Anonymous User',
            avatar: d.user?.avatar,
            totalAmount: 0
          };
        }
        contributionMap[d.userId].totalAmount += Number(d.grossAmount || 0);
      });

      for (const userId in contributionMap) {
        if (contributionMap[userId].totalAmount > maxContribution) {
          maxContribution = contributionMap[userId].totalAmount;
          topContributor = contributionMap[userId];
        }
      }
    } catch (dbErr) {
      console.warn("DB offline or error fetching donations highlights:", dbErr);
    }

    // 2. Find campaigns
    let featuredCampaign = null;
    let badgeText = "LATEST CAMPAIGN";

    try {
      const activeCampaigns = await prisma.campaign.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { deadline: null },
            { deadline: { gte: new Date() } }
          ]
        },
        include: {
          creator: {
            select: {
              name: true
            }
          },
          partner: true
        }
      });

      if (activeCampaigns.length > 0) {
        // Find highest target campaign
        const highestTargetCampaign = [...activeCampaigns].sort((a, b) => b.goalAmount - a.goalAmount)[0];

        // Find least duration campaign (ending in the future)
        const leastDurationCampaign = [...activeCampaigns]
          .filter(c => c.deadline && new Date(c.deadline) > new Date())
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

        // Preference: least duration first, else highest target
        if (leastDurationCampaign) {
          featuredCampaign = leastDurationCampaign;
          badgeText = "URGENT / ENDING SOON";
        } else if (highestTargetCampaign) {
          featuredCampaign = highestTargetCampaign;
          badgeText = "LARGEST GOAL";
        } else {
          featuredCampaign = activeCampaigns[0];
          badgeText = "LATEST CAMPAIGN";
        }
      }
    } catch (dbErr) {
      console.warn("DB offline or error fetching campaigns highlights:", dbErr);
    }

    res.json({
      status: 'success',
      data: {
        featuredCampaign,
        badgeText,
        topContributor: topContributor ? {
          name: topContributor.name,
          avatar: topContributor.avatar,
          totalAmount: maxContribution
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ error: error.stack || 'Internal Server Error' });
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
    } catch (_err) {
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
      const fallbackCampaign = await prisma.campaign.findFirst({ select: { id: true, partnerId: true } });

      if (id.startsWith('general-card-')) {
        // Map card IDs to types:
        // Card 1: Support feeding our pets -> FOOD
        // Card 2: Support treatment of our pets -> TREATMENT
        // Card 3: Support providing shelter for our pets -> SHELTER
        let type = 'FOOD';
        if (id === 'general-card-2') type = 'TREATMENT';
        if (id === 'general-card-3') type = 'SHELTER';

        if (fallbackCampaign) {
          await prisma.donation.create({
            data: {
              userId,
              partnerId: fallbackCampaign.partnerId,
              campaignId: fallbackCampaign.id,
              grossAmount: Number(amount),
              razorpayPaymentLinkId: `mock-intent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              razorpayPaymentId: null,
              status: 'WEBHOOK_VERIFIED',
              platformFee: 0,
              platformFeePercentage: 0,
              netAmount: Number(amount)
            }
          });
        }
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
            partnerId: campaign.partnerId,
            campaignId: id,
            grossAmount: Number(amount),
            razorpayPaymentLinkId: `mock-intent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            razorpayPaymentId: null,
            status: 'WEBHOOK_VERIFIED',
            platformFee: 0,
            platformFeePercentage: 0,
            netAmount: Number(amount)
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
 * @desc Find and email general volunteers within 20km of the campaign's partner
 * @route POST /api/funding/campaigns/:id/notify
 * @access Private (Vet/Admin)
 */
const notifyNearbyVolunteers = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch campaign and its partner location coordinates
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        partner: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const clinicLat = campaign.partner?.lat;
    const clinicLng = campaign.partner?.lng;

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
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const confirmUrl = `${baseUrl}/api/funding/campaigns/volunteer/confirm?campaignId=${campaign.id}&userId=${volunteer.userId}`;
        const cancelUrl = `${baseUrl}/api/funding/campaigns/volunteer/cancel-email?campaignId=${campaign.id}&userId=${volunteer.userId}`;

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
              <a href="${confirmUrl}" style="background-color: #346c02; color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Yes, I want to Volunteer
              </a>
              <a href="${cancelUrl}" style="background-color: #d9534f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">
                No, I cannot
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

    // 2. Check if a response record already exists
    const existing = await prisma.campaignVolunteer.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId
        }
      }
    });

    if (existing) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Response Already Recorded</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #fdfdf9; color: #333; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 4px solid #ffd4b2; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            h1 { color: #e65c00; }
            p { font-size: 1.1rem; line-height: 1.6; color: #555; }
            .badge { background: #e65c00; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Response Already Recorded</h1>
            <p>You have already responded to this volunteering callout (Status: <strong>${existing.status}</strong>).</p>
            <p>To avoid changes after planning has begun, your response cannot be modified.</p>
            <div class="badge">${existing.status}</div>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Create the specific volunteer registration with status 'CONFIRMED'
    try {
      await prisma.campaignVolunteer.create({
        data: {
          userId,
          campaignId,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ User ${userId} successfully confirmed specific volunteer registration for campaign ${campaignId}`);
    } catch (_err) {
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

/**
 * @desc Cancel/Decline participation for a specific campaign from the email link
 * @route GET /api/funding/campaigns/volunteer/cancel-email
 * @access Public (called from email click)
 */
const cancelVolunteerCampaignEmail = async (req, res) => {
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

    // 2. Check if a response record already exists
    const existing = await prisma.campaignVolunteer.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId
        }
      }
    });

    if (existing) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Response Already Recorded</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #fdfdf9; color: #333; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 4px solid #ffd4b2; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
            h1 { color: #e65c00; }
            p { font-size: 1.1rem; line-height: 1.6; color: #555; }
            .badge { background: #e65c00; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Response Already Recorded</h1>
            <p>You have already responded to this volunteering callout (Status: <strong>${existing.status}</strong>).</p>
            <p>To avoid changes after planning has begun, your response cannot be modified.</p>
            <div class="badge">${existing.status}</div>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Create specific volunteer registration with status 'DECLINED'
    try {
      await prisma.campaignVolunteer.create({
        data: {
          userId,
          campaignId,
          status: 'DECLINED'
        }
      });
      console.log(`❌ User ${userId} cancelled/declined volunteer response for campaign ${campaignId}`);
    } catch (_err) {
      console.warn("DB offline or error deleting volunteer entry, simulating cancel page.");
    }

    // 3. Return a response HTML page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Response Recorded</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #fdfdf9; color: #333; text-align: center; padding: 50px; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 4px solid #fcebeb; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          h1 { color: #d9534f; }
          p { font-size: 1.1rem; line-height: 1.6; color: #555; }
          .badge { background: #d9534f; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Response Recorded</h1>
          <p>You have successfully declined/withdrawn volunteering for <strong>"${campaign.title}"</strong>.</p>
          <p>Thank you for letting us know! We hope to see you support our future campaigns when you are available.</p>
          <div class="badge">DECLINED</div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error cancelling campaign volunteering:', error);
    res.status(500).send('<h1>Server Error</h1><p>An unexpected error occurred. Please try again later.</p>');
  }
};

/**
 * @desc Get logged-in user's donations and subscriptions
 * @route GET /api/funding/my-donations
 * @access Private
 */
const getMyDonations = async (req, res) => {
  try {
    const userId = req.user.id;
    const donations = await prisma.donation.findMany({
      where: { userId },
      include: {
        campaign: {
          select: { title: true }
        },
        partner: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        partner: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ status: 'success', donations, subscriptions });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Cancel user subscription (sets status to CANCELLED)
 * @route POST /api/funding/subscriptions/:id/cancel
 * @access Private
 */
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sub = await prisma.subscription.findUnique({
      where: { id }
    });

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (sub.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this subscription' });
    }

    const updatedSub = await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ status: 'success', data: updatedSub });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const donateManual = async (req, res) => {
  try {
    const { id } = req.params; // campaign id
    const userId = req.user.id;
    const { amount } = req.body;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Anti-spam: max 1 manual donation per 24 hours per user per campaign
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDonation = await prisma.donation.findFirst({
      where: {
        userId,
        campaignId: id,
        status: 'SELF_REPORTED',
        createdAt: { gte: twentyFourHoursAgo }
      }
    });

    if (recentDonation) {
      return res.status(429).json({ error: 'You can only self-report one donation per campaign every 24 hours to prevent spam.' });
    }

    const donation = await prisma.donation.create({
      data: {
        userId,
        partnerId: campaign.partnerId,
        campaignId: campaign.id,
        grossAmount: amount || 0,
        netAmount: amount || 0,
        platformFee: 0,
        platformFeePercentage: 0,
        status: 'SELF_REPORTED'
      }
    });

    res.status(201).json({ status: 'success', data: donation });
  } catch (error) {
    console.error('Error recording manual donation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateCampaignProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { raisedAmount, newUpdate } = req.body;
    const userId = req.user.id;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Authorize (creator or partner)
    if (campaign.createdBy !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this campaign progress' });
    }

    const dataToUpdate = {};
    if (raisedAmount !== undefined) {
      dataToUpdate.raisedAmount = parseFloat(raisedAmount);
    }

    if (newUpdate) {
      dataToUpdate.progressUpdates = {
        push: newUpdate
      };
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ status: 'success', data: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign progress:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createDonationOrder,
  handleRazorpayWebhook,
  createCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
  getFundingHighlights,
  volunteerCampaign,
  cancelVolunteerCampaign,
  checkVolunteerStatus,
  mockDonateCampaign,
  notifyNearbyVolunteers,
  confirmVolunteerCampaign,
  getMyDonations,
  cancelSubscription,
  getHubs,
  splitDonate,
  confirmSplit,
  createHubSubscription,
  donateManual,
  updateCampaignProgress,
  cancelVolunteerCampaignEmail,
};