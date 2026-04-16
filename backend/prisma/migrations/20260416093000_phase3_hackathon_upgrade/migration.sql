CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TABLE "Policy"
ADD COLUMN "basePremium" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW';

ALTER TABLE "TriggerEvent"
ADD COLUMN "rainfall" DOUBLE PRECISION,
ADD COLUMN "aqi" INTEGER,
ADD COLUMN "disruptionFrequency" DOUBLE PRECISION;

ALTER TABLE "Claim"
ADD COLUMN "fraudFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fraudReason" TEXT,
ADD COLUMN "fraudRiskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW';

CREATE INDEX "Policy_riskLevel_riskScore_idx" ON "Policy"("riskLevel", "riskScore");
CREATE INDEX "Claim_fraudFlag_createdAt_idx" ON "Claim"("fraudFlag", "createdAt");
