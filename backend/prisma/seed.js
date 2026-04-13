const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ZONE_RISK = {
  Koramangala: 'high',
  Indiranagar: 'medium',
  Whitefield: 'high',
  HSR: 'low'
};

const PLAN_CONFIG = {
  BASIC: { basePremium: 18, maxWeeklyPayout: 1800 },
  STANDARD: { basePremium: 35, maxWeeklyPayout: 3000 },
  PREMIUM: { basePremium: 55, maxWeeklyPayout: 4500 }
};

function calculatePremium(planType, zoneRisk, platform) {
  let premium = PLAN_CONFIG[planType].basePremium;
  if (zoneRisk === 'high') premium += 8;
  if (zoneRisk === 'medium') premium += 4;
  if (platform === 'ZOMATO') premium += 4; // simple outage-prone assumption for MVP
  return premium;
}

async function main() {
  await prisma.payout.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.triggerEvent.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.user.deleteMany();

  const workers = [
    {
      fullName: 'Arjun Kumar',
      phone: '9876500011',
      platform: 'ZOMATO',
      city: 'Bengaluru',
      zone: 'Koramangala',
      avgDailyEarnings: 1200,
      upiId: 'arjun@upi',
      planType: 'PREMIUM'
    },
    {
      fullName: 'Meena Ravi',
      phone: '9876500012',
      platform: 'SWIGGY',
      city: 'Bengaluru',
      zone: 'Indiranagar',
      avgDailyEarnings: 950,
      upiId: 'meena@upi',
      planType: 'STANDARD'
    },
    {
      fullName: 'Sadiq Ali',
      phone: '9876500013',
      platform: 'ZOMATO',
      city: 'Bengaluru',
      zone: 'HSR',
      avgDailyEarnings: 1050,
      upiId: 'sadiq@upi',
      planType: 'BASIC'
    }
  ];

  for (const worker of workers) {
    const user = await prisma.user.create({
      data: {
        fullName: worker.fullName,
        phone: worker.phone,
        platform: worker.platform,
        city: worker.city,
        zone: worker.zone,
        avgDailyEarnings: worker.avgDailyEarnings,
        upiId: worker.upiId
      }
    });

    const weeklyPremium = calculatePremium(
      worker.planType,
      ZONE_RISK[worker.zone] || 'low',
      worker.platform
    );

    await prisma.policy.create({
      data: {
        userId: user.id,
        planType: worker.planType,
        weeklyPremium,
        maxWeeklyPayout: PLAN_CONFIG[worker.planType].maxWeeklyPayout,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });
  }

  console.log('✅ Seed complete with sample workers and active policies.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
