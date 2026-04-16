-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ZOMATO', 'SWIGGY');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('RAIN', 'AQI', 'OUTAGE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('INITIATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PROCESSED', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "platform" "Platform",
    "city" TEXT,
    "zone" TEXT,
    "avgDailyEarnings" DOUBLE PRECISION,
    "upiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'WORKER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planType" "PlanType" NOT NULL,
    "weeklyPremium" DOUBLE PRECISION NOT NULL,
    "maxWeeklyPayout" DOUBLE PRECISION NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'INACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerEvent" (
    "id" SERIAL NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "zone" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "policyId" INTEGER NOT NULL,
    "triggerEventId" INTEGER NOT NULL,
    "payoutAmount" DOUBLE PRECISION NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutMethod" TEXT NOT NULL,
    "razorpayPayoutId" TEXT,
    "razorpayFundAccountId" TEXT,
    "failureReason" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Policy_userId_status_idx" ON "Policy"("userId", "status");

-- CreateIndex
CREATE INDEX "TriggerEvent_zone_triggerType_idx" ON "TriggerEvent"("zone", "triggerType");

-- CreateIndex
CREATE INDEX "Claim_userId_createdAt_idx" ON "Claim"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_policyId_triggerEventId_key" ON "Claim"("policyId", "triggerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_claimId_key" ON "Payout"("claimId");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_triggerEventId_fkey" FOREIGN KEY ("triggerEventId") REFERENCES "TriggerEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
