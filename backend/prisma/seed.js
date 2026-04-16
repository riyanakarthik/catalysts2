const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { calculateWeeklyPremium } = require('../src/services/premiumService');
const { normalizeZoneName } = require('../src/config/zones');

const prisma = new PrismaClient();

async function main() {
  await prisma.payout.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.triggerEvent.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const workerPassword = await bcrypt.hash('Worker@123', 10);

  await prisma.user.create({
    data: {
      fullName: 'Demo Admin',
      phone: '9990000001',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

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
      zone: 'HSR Layout',
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
        zone: normalizeZoneName(worker.zone),
        avgDailyEarnings: worker.avgDailyEarnings,
        upiId: worker.upiId,
        password: workerPassword,
        role: 'WORKER'
      }
    });

    const premium = await calculateWeeklyPremium({
      ...user,
      planType: worker.planType
    });

    await prisma.policy.create({
      data: {
        userId: user.id,
        planType: worker.planType,
        basePremium: premium.basePremium,
        weeklyPremium: premium.weeklyPremium,
        riskScore: premium.riskScore,
        riskLevel: premium.riskLevel,
        maxWeeklyPayout: premium.maxWeeklyPayout,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });
  }

  console.log('Seed complete with demo admin, sample workers, and active policies.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
