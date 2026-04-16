const prisma = require('../prisma');
const { PLAN_CONFIG, PAYOUT_PERCENTAGE } = require('../config/constants');
const { initiateRazorpayPayout } = require('./payoutService');
const { runFraudAssessment } = require('./fraudService');

function calculatePayout(avgDailyEarnings, triggerType, maxWeeklyPayout) {
  const percentage = PAYOUT_PERCENTAGE[triggerType] || 0;
  const payout = avgDailyEarnings * percentage;
  return Math.min(payout, maxWeeklyPayout);
}

async function processTriggerClaims(triggerEvent) {
  const activePolicies = await prisma.policy.findMany({
    where: {
      status: 'ACTIVE',
      user: { zone: triggerEvent.zone }
    },
    include: { user: true }
  });

  const createdClaims = [];

  for (const policy of activePolicies) {
    const coverage = PLAN_CONFIG[policy.planType].coverage;
    if (!coverage.includes(triggerEvent.triggerType)) {
      continue;
    }

    const existingClaim = await prisma.claim.findFirst({
      where: {
        policyId: policy.id,
        triggerEventId: triggerEvent.id
      }
    });

    if (existingClaim) {
      continue;
    }

    // ── FRAUD ASSESSMENT ──────────────────────────────────────────────
    const fraudReport = await runFraudAssessment({
      userId: policy.userId,
      triggerType: triggerEvent.triggerType,
      zone: triggerEvent.zone,
      eventTime: triggerEvent.detectedAt || new Date(),
    });

    // If fraud score is too high, reject the claim
    if (fraudReport.verdict === 'BLOCKED') {
      console.warn(`[TriggerService] 🚫 Claim BLOCKED for user ${policy.userId} — fraud score ${fraudReport.overallScore.toFixed(3)}`);

      const claim = await prisma.claim.create({
        data: {
          userId: policy.userId,
          policyId: policy.id,
          triggerEventId: triggerEvent.id,
          payoutAmount: 0,
          status: 'REJECTED'
        }
      });

      createdClaims.push({ ...claim, fraudReport, blocked: true });
      continue;
    }

    // If suspicious, log but still process (manual review queue in production)
    if (fraudReport.verdict === 'SUSPICIOUS') {
      console.warn(`[TriggerService] ⚠️ Claim flagged SUSPICIOUS for user ${policy.userId} — score ${fraudReport.overallScore.toFixed(3)}. Processing with flag.`);
    }
    // ──────────────────────────────────────────────────────────────────

    const payoutAmount = calculatePayout(
      policy.user.avgDailyEarnings,
      triggerEvent.triggerType,
      policy.maxWeeklyPayout
    );

    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        userId: policy.userId,
        policyId: policy.id,
        triggerEventId: triggerEvent.id,
        payoutAmount,
        status: 'APPROVED'
      }
    });

    // Initiate real Razorpay payout to the worker's UPI
    const payout = await initiateRazorpayPayout(
      policy.user,
      payoutAmount,
      claim.id
    );

    createdClaims.push({ ...claim, payout, fraudReport });
  }

  return createdClaims;
}

module.exports = {
  processTriggerClaims,
  calculatePayout
};
