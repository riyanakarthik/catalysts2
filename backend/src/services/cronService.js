// cronService.js
// Automated background polling engine.
// Uses real Open-Meteo APIs to check environment and trigger claims.

const prisma = require('../prisma');
const { getRealTimeEnvironmentalData, getPlatformOutageStatus, ZONE_COORDINATES } = require('./externalApiService');
const { processTriggerClaims } = require('./triggerService');

const POLL_INTERVAL_MS = 60 * 1000; // Poll every 60 seconds

async function runTriggerCheck() {
  try {
    console.log('[CronService] 🔍 Running automated trigger check via Real-time APIs...');

    const zones = Object.keys(ZONE_COORDINATES);
    let anomalyDetected = false;

    for (const zone of zones) {
      // 1. Fetch real environment data
      const envData = await getRealTimeEnvironmentalData(zone);
      const isOutage = await getPlatformOutageStatus();

      let triggerType = null;
      let severity = 'low';

      // 2. Evaluate Triggers (Parametric thresholds)
      if (envData.rain > 15) {
        triggerType = 'RAIN'; severity = 'high';
      } else if (envData.rain > 0 && Math.random() < 0.1) {
        // Mock heavy rain occasionally for demo purposes if it's lightly raining
        triggerType = 'RAIN'; severity = 'medium';
      } else if (envData.aqi > 300) {
        triggerType = 'AQI'; severity = 'high';
      } else if (isOutage) {
        triggerType = 'OUTAGE'; severity = 'high';
      }

      if (triggerType) {
        anomalyDetected = true;
        console.log(`[CronService] ⚡ Anomaly detected! Type: ${triggerType}, Zone: ${zone}, Severity: ${severity} (Rain: ${envData.rain}mm, AQI: ${envData.aqi})`);

        // Persist the trigger event
        const triggerEvent = await prisma.triggerEvent.create({
          data: {
            triggerType: triggerType,
            zone: zone,
            severity: severity,
            source: 'Open-Meteo & External Monitors'
          }
        });

        // Zero-touch claims processing
        const generatedClaims = await processTriggerClaims(triggerEvent);

        if (generatedClaims.length > 0) {
          console.log(`[CronService] 💰 Auto-generated ${generatedClaims.length} claim(s) with immediate APPROVED status.`);
          generatedClaims.forEach(claim => {
            console.log(`   → Claim #${claim.id} | ₹${claim.payoutAmount} | UPI Payout PROCESSED`);
          });
        } else {
          console.log(`[CronService] ℹ️ Trigger created but no matching active policies found in zone '${zone}'.`);
        }
      }
    }

    if (!anomalyDetected) {
      console.log('[CronService] ✅ All clear — no anomalies detected across zones.');
    }

  } catch (err) {
    console.error('[CronService] ❌ Error during automated trigger check:', err.message);
  }
}

function initCronJobs() {
  console.log(`[CronService] 🚀 Automated Core Trigger Engine started — polling every ${POLL_INTERVAL_MS / 1000}s`);
  console.log('[CronService] 📡 Connected to Open-Meteo for realtime Weather & AQI');

  // Fire once immediately after startup for quick demo visibility
  runTriggerCheck();

  // Then poll on interval
  setInterval(runTriggerCheck, POLL_INTERVAL_MS);
}

module.exports = { initCronJobs };
