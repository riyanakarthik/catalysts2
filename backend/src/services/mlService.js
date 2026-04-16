// mlService.js
// Provides real Machine Learning models using simple-statistics
// Replaces the previous Math.random() based mock logic.

const { linearRegression, linearRegressionLine } = require('simple-statistics');

// We simulate historical training data based on Zone environmental factors
// x = [historical typical rain severity, recent AQI severity, platform stability]
// y = pricing premium coefficient
// For a robust example, let's train a Linear Regression model on initialization.

// Historical dataset pairs: [[rain, aqi, downtime], premium_adjustment]
// We'll simplify to just an aggregate historical risk index vs output premium for simple linear regression
const trainingData = [
  [0, -2],     // Risk index 0 -> reduction in premium (-2)
  [20, 2],     // Risk index 20 -> small increase
  [50, 6],     // Risk index 50 -> moderate increase
  [80, 10],    // Risk index 80 -> high increase
  [100, 15]    // Risk index 100 -> max increase
];

let riskPricingModel = null;

function trainPricingModel() {
  const regressionTerms = linearRegression(trainingData);
  riskPricingModel = linearRegressionLine(regressionTerms);
  console.log('[MLService] 🧠 Trained Predictive Pricing Linear Regression Model successfully.');
}

// Initial training
trainPricingModel();

/**
 * Evaluates real-time external data to predict a risk score and pricing adjustment.
 */
async function getPredictiveRiskScore(zone, currentEnvData) {
  // Aggregate a current 'Risk Index' purely based on environmental stats
  const { temperature, rain, aqi } = currentEnvData;

  let computedRiskIndex = 0;
  
  if (rain > 0) computedRiskIndex += (rain * 2); 
  if (aqi > 200) computedRiskIndex += ((aqi - 200) / 10);
  if (temperature > 40) computedRiskIndex += (temperature - 40) * 5;

  // Cap risk index at 100 for model stability
  computedRiskIndex = Math.min(computedRiskIndex, 100);

  // Predict pricing adjustment using the trained linear model
  let pricingAdjustment = riskPricingModel(computedRiskIndex);
  
  // Format the output
  let prediction = 'stable_average';
  let reasoning = 'Current ML model output dictates stable conditions based on live API parameters.';

  if (computedRiskIndex > 40) {
    prediction = 'high_risk';
    reasoning = `ML Linear Model detects significant risk (Index: ${computedRiskIndex.toFixed(1)}). Rain/AQI trends indicate approaching disruptions in ${zone}.`;
  } else if (computedRiskIndex < 10) {
    prediction = 'clear_skies';
    reasoning = `ML Models predict ultra-low risk parameters (Index: ${computedRiskIndex.toFixed(1)}) in ${zone}. Premium dynamically reduced.`;
  }

  return {
    zone,
    prediction,
    pricingAdjustment: Math.round(pricingAdjustment),
    aiReasoning: reasoning,
    riskIndex: computedRiskIndex
  };
}

module.exports = {
  getPredictiveRiskScore,
  trainPricingModel
};
