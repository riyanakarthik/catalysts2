const crypto = require("crypto");
const razorpayService = require("../services/razorpayService");
const prisma = require("../prisma");
const { calculateWeeklyPremium } = require("../services/premiumService");
const { t } = require('../services/i18nService');

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", planType } = req.body;
    const userId = req.user.userId;

    const order = await razorpayService.createOrder({
      amount,
      currency,
      receipt: `policy_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        planType,
      },
    });

    res.json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
    } = req.body;

    const userId = req.user.userId;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ verified: false, message: "Signature mismatch" });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ verified: false, message: "User not found" });
    }

    const premiumQuote = await calculateWeeklyPremium({
      ...user,
      planType
    });

    await prisma.policy.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 7);

    const policy = await prisma.policy.create({
      data: {
        userId: user.id,
        planType,
        basePremium: premiumQuote.basePremium,
        weeklyPremium: premiumQuote.weeklyPremium,
        riskScore: premiumQuote.riskScore,
        riskLevel: premiumQuote.riskLevel,
        maxWeeklyPayout: premiumQuote.maxWeeklyPayout,
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    res.json({
      verified: true,
      paymentId: razorpay_payment_id,
      message: t(req, 'paymentVerified'),
      policy,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ verified: false, message: "Verification failed" });
  }
};

exports.getKey = (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};
