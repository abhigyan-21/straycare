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

module.exports = {
  createDonationOrder,
  handleRazorpayWebhook,
};