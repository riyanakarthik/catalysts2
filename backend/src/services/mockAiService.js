// mockAiService.js
// Represents an external Machine Learning model predicting risk factors and environmental changes.

const PREDICTIVE_WEATHER_RISK = {
  clear_skies: -5,        // Historic safety deducts 5 rupees per week
  approaching_monsoon: 8, // Risk approaching increases premium
  stable_average: 0       // Stable pattern does nothing
};

const ZONES = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City'];

async function getPredictiveRiskScore(zone) {
  // Simulate network delay to ML Oracle
  await new Promise(res => setTimeout(res, 300));

  // Determine an arbitrary risk profile based on local strings simply for mock ML purposes.
  // In reality, this queries your ML engine APIs.
  const riskIndex = Math.random();

  let prediction = 'stable_average';
  let reasoning = 'Current long-term forecasting dictates stable conditions.';

  if (riskIndex > 0.75) {
    prediction = 'approaching_monsoon';
    reasoning = `AI models track ~65% probability of extended water-logging algorithms triggering off seasonal averages surrounding ${zone}.`;
  } else if (riskIndex < 0.3) {
    prediction = 'clear_skies';
    reasoning = `Hyper-local predictive indices classify ${zone} as 98% safe historically through current drought conditions. Premium dynamically reduced.`;
  }

  return {
    zone,
    prediction,
    pricingAdjustment: PREDICTIVE_WEATHER_RISK[prediction],
    aiReasoning: reasoning
  };
}

async function checkEnvironmentalTriggers() {
  await new Promise(res => setTimeout(res, 200));

  // 1 in 10 chance of ANY anomaly firing during a single run sequence
  const randomDice = Math.random();
  if (randomDice > 0.10) {
    return null; // Stable
  }

  // Anomalous condition triggered, figure out what it is
  const triggerTypes = ['RAIN', 'AQI', 'OUTAGE'];
  const triggerIndex = Math.floor(Math.random() * triggerTypes.length);
  const type = triggerTypes[triggerIndex];

  // Pick random zone
  const zoneIndex = Math.floor(Math.random() * ZONES.length);
  const zone = ZONES[zoneIndex];

  // Pick random severity
  const severityIndex = Math.random();
  const severity = severityIndex > 0.5 ? 'high' : 'medium';

  return {
    triggerType: type,
    zone,
    severity,
    source: `auto-ai-cron-${type.toLowerCase()}-watch`
  };
}

module.exports = {
  getPredictiveRiskScore,
  checkEnvironmentalTriggers
};
