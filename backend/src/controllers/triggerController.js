const prisma = require('../prisma');
const { processTriggerClaims } = require('../services/triggerService');
const { runFraudAssessment } = require('../services/fraudService');
const { t } = require('../services/i18nService');
const { normalizeZoneName, isSupportedZone } = require('../config/zones');

async function simulateTrigger(req, res) {
  try {
    const { triggerType, zone, severity = 'medium', source = 'manual-admin-simulation' } = req.body;
    const normalizedZone = normalizeZoneName(zone);

    if (!isSupportedZone(normalizedZone)) {
      return res.status(400).json({ message: 'Unsupported zone for trigger simulation' });
    }

    const triggerEvent = await prisma.triggerEvent.create({
      data: {
        triggerType,
        zone: normalizedZone,
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
    const normalizedZone = normalizeZoneName(zone || 'Koramangala');

    if (!isSupportedZone(normalizedZone)) {
      return res.status(400).json({ message: 'Unsupported zone for fraud check' });
    }

    const report = await runFraudAssessment({
      userId: Number(userId),
      triggerType: triggerType || 'RAIN',
      zone: normalizedZone
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
