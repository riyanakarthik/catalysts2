const prisma = require('../prisma');
const { calculateWeeklyPremium } = require('../services/premiumService');

async function createPolicy(req, res) {
  try {
    const userId = req.user.userId;
    const { planType, activateNow } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { weeklyPremium, maxWeeklyPayout } = await calculateWeeklyPremium(planType, user.zone, user.platform);

    await prisma.policy.updateMany({
      where: { userId: user.id, status: 'ACTIVE' },
      data: { status: 'INACTIVE' }
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 7);

    const policy = await prisma.policy.create({
      data: {
        userId: user.id,
        planType,
        weeklyPremium,
        maxWeeklyPayout,
        status: activateNow ? 'ACTIVE' : 'INACTIVE',
        startDate,
        endDate
      }
    });

    return res.status(201).json(policy);
  } catch (error) {
    console.error('createPolicy error', error);
    return res.status(400).json({ message: 'Failed to create policy', error: error.message });
  }
}

async function getPoliciesByUser(req, res) {
  try {
    const userId = Number(req.user.userId);
    const policies = await prisma.policy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(policies);
  } catch (error) {
    console.error('getPoliciesByUser error', error);
    return res.status(500).json({ message: 'Failed to fetch policies' });
  }
}

module.exports = {
  createPolicy,
  getPoliciesByUser
};
