const prisma = require('../prisma');
const { processTriggerClaims } = require('../services/triggerService');
const { runFraudAssessment } = require('../services/fraudService');

async function simulateTrigger(req, res) {
  try {
    const { triggerType, zone, severity = 'medium', source = 'manual-admin-simulation' } = req.body;

    const triggerEvent = await prisma.triggerEvent.create({
      data: {
        triggerType,
        zone,
        severity,
        source
      }
    });

    const generatedClaims = await processTriggerClaims(triggerEvent);

    return res.status(201).json({
      triggerEvent,
      generatedClaimsCount: generatedClaims.length,
      generatedClaims
    });
  } catch (error) {
    console.error('simulateTrigger error', error);
    return res.status(400).json({ message: 'Failed to simulate trigger', error: error.message });
  }
}

/**
 * Run a standalone fraud check on a specific user
 * Useful for admin dashboard / manual review
 */
async function fraudCheck(req, res) {
  try {
    const { userId, triggerType, zone, locationHistory, sensorData } = req.body;

    const report = await runFraudAssessment({
      userId: Number(userId),
      triggerType: triggerType || 'RAIN',
      zone: zone || 'Koramangala',
      eventTime: new Date(),
      locationHistory,
      sensorData
    });

    return res.json(report);
  } catch (error) {
    console.error('fraudCheck error', error);
    return res.status(500).json({ message: 'Fraud check failed', error: error.message });
  }
}

module.exports = {
  simulateTrigger,
  fraudCheck
};
