const crypto = require("crypto");
const razorpayService = require("../services/razorpayService");
const prisma = require("../prisma");
const { calculateWeeklyPremium } = require("../services/premiumService");

// Create order
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

// Verify payment and activate policy
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
    } = req.body;

    const userId = req.user.userId;

    // 1. Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ verified: false, message: "Signature mismatch" });
    }

    // 2. Get user and calculate premium
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ verified: false, message: "User not found" });
    }

    const { weeklyPremium, maxWeeklyPayout } = await calculateWeeklyPremium(
      planType,
      user.zone,
      user.platform
    );

    // 3. Deactivate any existing active policy
    await prisma.policy.updateMany({
      where: { userId: user.id, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    // 4. Create new policy with payment reference
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 7);

    const policy = await prisma.policy.create({
      data: {
        userId: user.id,
        planType,
        weeklyPremium,
        maxWeeklyPayout,
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    console.log(
      `[Payment] ✅ Verified payment ${razorpay_payment_id} → Policy #${policy.id} activated for user ${userId}`
    );

    res.json({
      verified: true,
      paymentId: razorpay_payment_id,
      policy,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ verified: false, message: "Verification failed" });
  }
};

// Expose Razorpay key to frontend
exports.getKey = (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};