const prisma = require('../prisma');
const { PLAN_CONFIG, PAYOUT_PERCENTAGE } = require('../config/constants');
const { initiateRazorpayPayout } = require('./payoutService');
const { detectFraud } = require('./fraudService');
const { getRealTimeEnvironmentalData, getPlatformOutageStatus } = require('./externalApiService');

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

    let claim = await prisma.claim.create({
      data: {
        userId: policy.userId,
        policyId: policy.id,
        triggerEventId: triggerEvent.id,
        payoutAmount,
        status: 'APPROVED'
      }
    });

    const fraudReport = await detectFraud(policy, triggerEvent, claim);

    claim = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        fraudFlag: fraudReport.isFraud,
        fraudReason: fraudReport.fraudReason || null,
        fraudRiskLevel: fraudReport.riskLevel,
        status: fraudReport.isFraud ? 'REJECTED' : 'APPROVED',
        payoutAmount: fraudReport.isFraud ? 0 : payoutAmount
      }
    });

    if (fraudReport.isFraud) {
      createdClaims.push({
        ...claim,
        fraudReport,
        payout: null
      });
      continue;
    }

    const payout = await initiateRazorpayPayout(
      policy.user,
      payoutAmount,
      claim.id
    );

    createdClaims.push({ ...claim, payout, fraudReport });
  }

  return createdClaims;
}

function buildSeverity(triggerType, envData, isOutage) {
  if (triggerType === 'OUTAGE' || isOutage) return 'high';
  if (triggerType === 'RAIN') return envData.rainfall >= 18 ? 'high' : 'medium';
  if (triggerType === 'AQI') return envData.aqi >= 250 ? 'high' : 'medium';
  return 'low';
}

function evaluateTriggerThreshold(envData, isOutage) {
  if (envData.rainfall >= 12) return 'RAIN';
  if (envData.aqi >= 220) return 'AQI';
  if (isOutage || envData.disruptionFrequency >= 8) return 'OUTAGE';
  return null;
}

async function createAutomatedTriggerForZone(zone) {
  const envData = await getRealTimeEnvironmentalData(zone);
  const isOutage = await getPlatformOutageStatus();
  const triggerType = evaluateTriggerThreshold(envData, isOutage);

  if (!triggerType) {
    return null;
  }

  const existingRecentEvent = await prisma.triggerEvent.findFirst({
    where: {
      zone,
      triggerType,
      detectedAt: {
        gte: new Date(Date.now() - 60 * 1000)
      }
    }
  });

  if (existingRecentEvent) {
    return null;
  }

  return prisma.triggerEvent.create({
    data: {
      triggerType,
      zone,
      severity: buildSeverity(triggerType, envData, isOutage),
      source: 'automated-minute-evaluator',
      rainfall: envData.rainfall,
      aqi: envData.aqi,
      disruptionFrequency: envData.disruptionFrequency
    }
  });
}

module.exports = {
  calculatePayout,
  processTriggerClaims,
  createAutomatedTriggerForZone
};
