const prisma = require('../prisma');
const { calculateWeeklyPremium } = require('../services/premiumService');
const { buildZoneRiskContext } = require('../services/riskService');
const { t } = require('../services/i18nService');

async function calculatePremium(req, res) {
  try {
    const { planType, zoneData } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.userId) }
    });

    if (!user || !planType) {
      return res.status(400).json({ message: 'Authenticated user and planType are required' });
    }

    const premium = await calculateWeeklyPremium(
      { ...user, planType },
      zoneData ? buildZoneRiskContext(user.zone, zoneData) : undefined
    );

    return res.json({
      message: t(req, 'premiumCalculated'),
      data: premium
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  calculatePremium
};
