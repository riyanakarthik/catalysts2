const { calculateWeeklyPremium } = require('../services/premiumService');

async function calculatePremium(req, res) {
  try {
    const { planType, zone, platform } = req.body;
    if (!planType || !zone || !platform) {
      return res.status(400).json({ message: 'planType, zone and platform are required' });
    }
    const premium = await calculateWeeklyPremium(planType, zone, platform);
    return res.json(premium);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  calculatePremium
};
