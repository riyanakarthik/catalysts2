const prisma = require('../prisma');
const { getZoneRiskSnapshot } = require('./riskService');

async function getWorkerDashboard(userId) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    include: {
      policies: {
        orderBy: { createdAt: 'desc' }
      },
      claims: {
        include: {
          triggerEvent: true,
          payout: true,
          policy: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const activePolicy = user.policies.find((policy) => policy.status === 'ACTIVE') || null;
  const claimsTriggered = user.claims.length;
  const totalEarningsProtected = Number(
    user.claims.reduce((sum, claim) => sum + (claim.payoutAmount || 0), 0).toFixed(2)
  );
  const currentRisk = user.zone ? await getZoneRiskSnapshot({ zone: user.zone }) : null;

  return {
    worker: {
      id: user.id,
      fullName: user.fullName,
      platform: user.platform,
      city: user.city,
      zone: user.zone,
      avgDailyEarnings: user.avgDailyEarnings,
      upiId: user.upiId
    },
    activePolicy,
    policies: user.policies,
    claims: user.claims,
    weeklyPremium: activePolicy?.weeklyPremium || 0,
    claimsTriggered,
    totalEarningsProtected,
    currentRisk
  };
}

async function getAdminDashboard() {
  const [claims, users, policies] = await Promise.all([
    prisma.claim.findMany({
      include: {
        user: true,
        triggerEvent: true,
        payout: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      include: {
        policies: true
      }
    }),
    prisma.policy.findMany({
      where: { status: 'ACTIVE' }
    })
  ]);

  const totalClaims = claims.length;
  const fraudFlaggedClaims = claims.filter((claim) => claim.fraudFlag).length;
  const zoneScores = {};

  policies.forEach((policy) => {
    const worker = users.find((user) => user.id === policy.userId);
    if (!worker?.zone) return;

    if (!zoneScores[worker.zone]) {
      zoneScores[worker.zone] = { totalRisk: 0, count: 0, claims: 0 };
    }

    zoneScores[worker.zone].totalRisk += policy.riskScore;
    zoneScores[worker.zone].count += 1;
  });

  claims.forEach((claim) => {
    const zone = claim.triggerEvent?.zone;
    if (!zone) return;

    if (!zoneScores[zone]) {
      zoneScores[zone] = { totalRisk: 0, count: 0, claims: 0 };
    }

    zoneScores[zone].claims += 1;
  });

  const highRiskZones = Object.entries(zoneScores)
    .map(([zone, metrics]) => ({
      zone,
      averageRiskScore: Number((metrics.totalRisk / Math.max(metrics.count, 1)).toFixed(2)),
      recentClaims: metrics.claims
    }))
    .filter((zone) => zone.averageRiskScore >= 0.6 || zone.recentClaims >= 2)
    .sort((left, right) => right.averageRiskScore - left.averageRiskScore);

  const predictedDisruptions = highRiskZones.map((zone) => ({
    zone: zone.zone,
    prediction: zone.averageRiskScore >= 0.75 ? 'High chance of disruption this week' : 'Watchlist for potential disruption',
    confidence: zone.averageRiskScore >= 0.75 ? 'HIGH' : 'MEDIUM'
  }));

  return {
    totalClaims,
    fraudFlaggedClaims,
    highRiskZones,
    predictedDisruptions,
    claims,
    workers: users.filter((user) => user.role === 'WORKER')
  };
}

module.exports = {
  getWorkerDashboard,
  getAdminDashboard
};
