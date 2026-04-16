const prisma = require('../prisma');

function verifyDeviceSensors(sensorData) {
  if (!sensorData) {
    return { flagged: false, detail: 'No sensor data provided' };
  }

  const isMismatch = sensorData.accelerometerVar < 0.1 && sensorData.isGPSMoving;
  return {
    flagged: isMismatch,
    detail: isMismatch ? 'Sensor mismatch detected' : 'Sensor data consistent'
  };
}

function isVelocityAnomalous(locationHistory) {
  if (!Array.isArray(locationHistory) || locationHistory.length < 2) {
    return { flagged: false };
  }

  for (let index = 1; index < locationHistory.length; index += 1) {
    const current = locationHistory[index - 1];
    const previous = locationHistory[index];
    const elapsedHours = (new Date(current.timestamp) - new Date(previous.timestamp)) / (1000 * 60 * 60);

    if (elapsedHours <= 0) {
      return { flagged: true, detail: 'Invalid location timeline' };
    }

    const latGap = Math.abs(Number(current.lat) - Number(previous.lat));
    const lonGap = Math.abs(Number(current.lon) - Number(previous.lon));
    const approxKm = (latGap + lonGap) * 111;

    if ((approxKm / elapsedHours) > 100) {
      return { flagged: true, detail: 'Impossible worker movement detected' };
    }
  }

  return { flagged: false };
}

function buildFraudResult(reason, riskLevel) {
  return {
    isFraud: Boolean(reason),
    fraudReason: reason || '',
    riskLevel: reason ? riskLevel : 'LOW'
  };
}

async function detectFraud(policy, triggerEvent, claim) {
  if (new Date(policy.startDate) > new Date(triggerEvent.detectedAt)) {
    return buildFraudResult('Policy activated after the trigger event.', 'HIGH');
  }

  const shortWindowStart = new Date(triggerEvent.detectedAt.getTime() - (6 * 60 * 60 * 1000));
  const recentClaims = await prisma.claim.count({
    where: {
      userId: claim.userId,
      createdAt: { gte: shortWindowStart }
    }
  });

  if (recentClaims >= 2) {
    return buildFraudResult('Multiple claims were raised in a short time window.', 'HIGH');
  }

  const repeatedLocationClaims = await prisma.claim.count({
    where: {
      userId: claim.userId,
      triggerEvent: {
        zone: triggerEvent.zone
      }
    }
  });

  if (repeatedLocationClaims >= 3) {
    return buildFraudResult('Repeated claims detected from the same location.', 'MEDIUM');
  }

  return buildFraudResult('', 'LOW');
}

async function runFraudAssessment({ userId, triggerType, zone }) {
  const result = await detectFraud(
    { startDate: new Date(Date.now() - 60 * 60 * 1000) },
    { triggerType, zone, detectedAt: new Date() },
    { userId }
  );

  return {
    verdict: result.isFraud ? 'BLOCKED' : 'CLEAR',
    overallScore: result.isFraud ? 0.9 : 0.1,
    ...result
  };
}

module.exports = {
  detectFraud,
  runFraudAssessment,
  isVelocityAnomalous,
  verifyDeviceSensors
};
