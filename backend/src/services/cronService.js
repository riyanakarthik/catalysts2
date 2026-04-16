const { ZONE_COORDINATES } = require('./externalApiService');
const { processTriggerClaims, createAutomatedTriggerForZone } = require('./triggerService');

const POLL_INTERVAL_MS = 60 * 1000;

async function runTriggerCheck() {
  try {
    console.log('[CronService] Running automated trigger evaluation.');

    const zones = Object.keys(ZONE_COORDINATES);
    const runSummary = [];

    for (const zone of zones) {
      const triggerEvent = await createAutomatedTriggerForZone(zone);
      if (!triggerEvent) {
        continue;
      }

      const generatedClaims = await processTriggerClaims(triggerEvent);
      runSummary.push({
        zone,
        triggerType: triggerEvent.triggerType,
        claims: generatedClaims.length
      });
    }

    if (runSummary.length === 0) {
      console.log('[CronService] No trigger crossed threshold this cycle.');
      return;
    }

    console.log('[CronService] Automated cycle summary:', runSummary);
  } catch (error) {
    console.error('[CronService] Error during automated trigger check:', error.message);
  }
}

function initCronJobs() {
  console.log(`[CronService] Automated trigger engine polling every ${POLL_INTERVAL_MS / 1000}s.`);
  runTriggerCheck();
  setInterval(runTriggerCheck, POLL_INTERVAL_MS);
}

module.exports = { initCronJobs, runTriggerCheck };
