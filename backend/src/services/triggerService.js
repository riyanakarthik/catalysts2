const prisma = require('../prisma');
const { PLAN_CONFIG, PAYOUT_PERCENTAGE } = require('../config/constants');

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

    const payoutAmount = calculatePayout(
      policy.user.avgDailyEarnings,
      triggerEvent.triggerType,
      policy.maxWeeklyPayout
    );

    const claim = await prisma.claim.create({
      data: {
        userId: policy.userId,
        policyId: policy.id,
        triggerEventId: triggerEvent.id,
        payoutAmount,
        status: 'APPROVED'
      }
    });

    const payout = await prisma.payout.create({
      data: {
        claimId: claim.id,
        payoutStatus: 'PROCESSED',
        payoutMethod: 'UPI'
      }
    });

    createdClaims.push({ ...claim, payout });
  }

  return createdClaims;
}

module.exports = {
  processTriggerClaims,
  calculatePayout
};
