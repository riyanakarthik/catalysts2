const { PLAN_CONFIG, ZONE_RISK_MAP, PLATFORM_RELIABILITY } = require('../config/constants');
const { getPredictiveRiskScore } = require('./mockAiService');

async function calculateWeeklyPremium(planType, zone, platform) {
  const selectedPlan = PLAN_CONFIG[planType];
  if (!selectedPlan) {
    throw new Error('Invalid plan type');
  }

  const zoneRisk = ZONE_RISK_MAP[zone] || 'low';
  const platformReliability = PLATFORM_RELIABILITY[platform] || 'stable';

  let premium = selectedPlan.basePremium;

  // Base rules mapping manually assigned constants
  if (zoneRisk === 'high') premium += 8;
  if (zoneRisk === 'medium') premium += 4;
  if (platformReliability === 'outage-prone') premium += 4;

  // AI Integration Example: Dynamic Pricing Models utilizing Mock ML API
  // Adjusts the weekly premium directly matching predictive hyper-local risk indexing
  const aiInsights = await getPredictiveRiskScore(zone);
  premium += aiInsights.pricingAdjustment;

  // Ensure premium doesn't drop below a minimum threshold
  if (premium < 5) premium = 5;

  return {
    weeklyPremium: premium,
    maxWeeklyPayout: selectedPlan.maxWeeklyPayout,
    zoneRisk,
    platformReliability,
    aiReasoning: aiInsights.aiReasoning // Sending back the AI logic for potential frontend displays!
  };
}

module.exports = {
  calculateWeeklyPremium
};
