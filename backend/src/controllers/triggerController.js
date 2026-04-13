const prisma = require('../prisma');
const { processTriggerClaims } = require('../services/triggerService');

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

module.exports = {
  simulateTrigger
};
