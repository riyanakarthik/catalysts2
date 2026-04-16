const prisma = require('../prisma');
const { t } = require('../services/i18nService');

async function getAllClaims(req, res) {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        user: true,
        policy: true,
        triggerEvent: true,
        payout: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      message: t(req, 'claimsFetched'),
      data: claims
    });
  } catch (error) {
    console.error('getAllClaims error', error);
    return res.status(500).json({ message: 'Failed to fetch claims' });
  }
}

async function getClaimsByUser(req, res) {
  try {
    const userId = Number(req.params.userId);
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const claims = await prisma.claim.findMany({
      where: { userId },
      include: {
        triggerEvent: true,
        payout: true,
        policy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      message: t(req, 'claimsFetched'),
      data: claims
    });
  } catch (error) {
    console.error('getClaimsByUser error', error);
    return res.status(500).json({ message: 'Failed to fetch user claims' });
  }
}

module.exports = {
  getAllClaims,
  getClaimsByUser
};
