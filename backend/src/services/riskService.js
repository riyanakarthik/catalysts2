const { ZONE_RISK_MAP, RISK_LEVELS, RISK_WEIGHTS } = require('../config/constants');
const { getRealTimeEnvironmentalData } = require('./externalApiService');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRainfall(rainfall) {
  return clamp(rainfall / 25, 0, 1);
}

function normalizeAqi(aqi) {
  return clamp(aqi / 400, 0, 1);
}

function normalizeDisruptionFrequency(disruptionFrequency) {
  return clamp(disruptionFrequency / 10, 0, 1);
}

function getRiskLevel(riskScore) {
  if (riskScore >= RISK_LEVELS.HIGH) return 'HIGH';
  if (riskScore >= RISK_LEVELS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function buildZoneRiskContext(zone, environmentData = {}) {
  const zoneRisk = ZONE_RISK_MAP[zone] || 'low';
  const baselineDisruption = zoneRisk === 'high' ? 7 : zoneRisk === 'medium' ? 5 : 3;
  const rainfall = Number(environmentData.rainfall ?? environmentData.rain ?? 0);
  const aqi = Number(environmentData.aqi ?? 0);
  const disruptionFrequency = Number(
    environmentData.disruptionFrequency ??
    clamp(baselineDisruption + rainfall / 8 + (aqi > 180 ? 2 : 0), 1, 10)
  );

  return {
    rainfall,
    aqi,
    disruptionFrequency,
    zoneRisk
  };
}

function calculateRiskScore(zoneData) {
  const rainfallComponent = normalizeRainfall(zoneData.rainfall);
  const aqiComponent = normalizeAqi(zoneData.aqi);
  const disruptionComponent = normalizeDisruptionFrequency(zoneData.disruptionFrequency);
  const riskScore = clamp(
    (rainfallComponent * RISK_WEIGHTS.rainfall) +
    (aqiComponent * RISK_WEIGHTS.aqi) +
    (disruptionComponent * RISK_WEIGHTS.disruptionFrequency),
    0,
    1
  );

  return {
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel: getRiskLevel(riskScore),
    factors: {
      rainfall: Number(rainfallComponent.toFixed(2)),
      aqi: Number(aqiComponent.toFixed(2)),
      disruptionFrequency: Number(disruptionComponent.toFixed(2))
    }
  };
}

async function getZoneRiskSnapshot(user, zoneOverrideData) {
  const liveData = zoneOverrideData || await getRealTimeEnvironmentalData(user.zone);
  const zoneData = buildZoneRiskContext(user.zone, liveData);

  return {
    ...zoneData,
    ...calculateRiskScore(zoneData)
  };
}

module.exports = {
  buildZoneRiskContext,
  calculateRiskScore,
  getZoneRiskSnapshot
};
