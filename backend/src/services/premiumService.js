const {
  PLAN_CONFIG,
  PLATFORM_LOADING,
  PLATFORM_RELIABILITY,
  PREMIUM_RISK_MULTIPLIER
} = require('../config/constants');
const { getZoneRiskSnapshot } = require('./riskService');

async function calculateWeeklyPremium(user, zoneData) {
  const selectedPlan = PLAN_CONFIG[user.planType];
  if (!selectedPlan) {
    throw new Error('Invalid plan type');
  }

  const riskContext = await getZoneRiskSnapshot(user, zoneData);
  const basePremium = selectedPlan.basePremium;
  const riskMultiplier = PREMIUM_RISK_MULTIPLIER[riskContext.riskLevel] || 1;
  const platformMultiplier = PLATFORM_LOADING[user.platform] || 1;

  const finalPremium = Math.max(
    5,
    Math.round(basePremium * riskMultiplier * platformMultiplier + (riskContext.riskScore * 12))
  );

  return {
    basePremium,
    riskScore: riskContext.riskScore,
    riskLevel: riskContext.riskLevel,
    weeklyPremium: finalPremium,
    finalPremium,
    maxWeeklyPayout: selectedPlan.maxWeeklyPayout,
    zoneData: {
      rainfall: riskContext.rainfall,
      aqi: riskContext.aqi,
      disruptionFrequency: riskContext.disruptionFrequency
    },
    pricingBreakdown: {
      planType: user.planType,
      zone: user.zone,
      platform: user.platform,
      platformReliability: PLATFORM_RELIABILITY[user.platform] || 'stable',
      riskMultiplier,
      platformMultiplier
    }
  };
}

module.exports = {
  calculateWeeklyPremium
};
