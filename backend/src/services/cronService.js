// cronService.js
// Automated background polling engine.
// Mimics 3-5 different external trigger APIs (OpenWeather, AQI Tracker, Platform Outage, etc.)
// and auto-fires claims without any manual admin intervention.

const prisma = require('../prisma');
const { checkEnvironmentalTriggers } = require('./mockAiService');
const { processTriggerClaims } = require('./triggerService');

const POLL_INTERVAL_MS = 60 * 1000; // Poll every 60 seconds

async function runTriggerCheck() {
  try {
    console.log('[CronService] 🔍 Running automated trigger check via ML monitoring feeds...');

    const event = await checkEnvironmentalTriggers();

    if (!event) {
      console.log('[CronService] ✅ All clear — no anomalies detected.');
      return;
    }

    console.log(`[CronService] ⚡ Anomaly detected! Type: ${event.triggerType}, Zone: ${event.zone}, Severity: ${event.severity}`);

    // Persist the trigger event
    const triggerEvent = await prisma.triggerEvent.create({
      data: {
        triggerType: event.triggerType,
        zone: event.zone,
        severity: event.severity,
        source: event.source
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
      console.log(`[CronService] ℹ️ Trigger created but no matching active policies found in zone '${event.zone}'.`);
    }

  } catch (err) {
    console.error('[CronService] ❌ Error during automated trigger check:', err.message);
  }
}

function initCronJobs() {
  console.log(`[CronService] 🚀 Automated AI Trigger Engine started — polling every ${POLL_INTERVAL_MS / 1000}s`);
  console.log('[CronService] 📡 Monitoring: RAIN, AQI, PLATFORM OUTAGE triggers across all zones');

  // Fire once immediately after startup for quick demo visibility
  runTriggerCheck();

  // Then poll on interval
  setInterval(runTriggerCheck, POLL_INTERVAL_MS);
}

module.exports = { initCronJobs };
