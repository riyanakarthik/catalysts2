const prisma = require('../prisma');
const { processTriggerClaims } = require('../services/triggerService');
const { runFraudAssessment } = require('../services/fraudService');
const { t } = require('../services/i18nService');

async function simulateTrigger(req, res) {
  try {
    const { triggerType, zone, severity = 'medium', source = 'manual-admin-simulation' } = req.body;

    const triggerEvent = await prisma.triggerEvent.create({
      data: {
        triggerType,
        zone,
        severity,
        source,
        rainfall: req.body.rainfall ?? null,
        aqi: req.body.aqi ?? null,
        disruptionFrequency: req.body.disruptionFrequency ?? null
      }
    });

    const generatedClaims = await processTriggerClaims(triggerEvent);

    return res.status(201).json({
      message: t(req, 'triggerProcessed'),
      data: {
        triggerEvent,
        generatedClaimsCount: generatedClaims.length,
        generatedClaims
      }
    });
  } catch (error) {
    console.error('simulateTrigger error', error);
    return res.status(400).json({ message: 'Failed to simulate trigger', error: error.message });
  }
}

async function fraudCheck(req, res) {
  try {
    const { userId, triggerType, zone } = req.body;

    const report = await runFraudAssessment({
      userId: Number(userId),
      triggerType: triggerType || 'RAIN',
      zone: zone || 'Koramangala'
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
