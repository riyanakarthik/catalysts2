// fraudService.js
// Advanced Fraud Detection Engine for Delivery-Specific Insurance
// Covers: GPS spoofing, fake weather claims, behavioral anomalies, ring detection

const axios = require('axios');
const prisma = require('../prisma');
const { ZONE_COORDINATES } = require('./externalApiService');

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: GPS SPOOFING DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Haversine formula — distance between two coordinates in km
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GPS Velocity Anomaly Detection
 * Flags impossible travel speeds (>100 km/hr in urban zones)
 */
function isVelocityAnomalous(locationHistory) {
  if (!locationHistory || locationHistory.length < 2) return { flagged: false };

  const flags = [];

  for (let i = 1; i < locationHistory.length; i++) {
    const current = locationHistory[i - 1];
    const previous = locationHistory[i];

    const distanceKm = calculateHaversineDistance(previous.lat, previous.lon, current.lat, current.lon);
    const timeDiffHours = (new Date(current.timestamp) - new Date(previous.timestamp)) / (1000 * 60 * 60);

    if (timeDiffHours <= 0) {
      flags.push({ type: 'INVALID_TIMESTAMP', detail: 'Timestamps are non-sequential or identical' });
      continue;
    }

    const velocityKmHr = distanceKm / timeDiffHours;

    if (velocityKmHr > 100) {
      flags.push({
        type: 'IMPOSSIBLE_VELOCITY',
        detail: `${velocityKmHr.toFixed(1)} km/hr between points (max allowed: 100 km/hr)`,
        velocity: velocityKmHr,
        distance: distanceKm
      });
    }
  }

  return {
    flagged: flags.length > 0,
    flags,
    confidence: flags.length > 0 ? Math.min(0.95, 0.5 + flags.length * 0.15) : 0
  };
}

/**
 * GPS Drift Pattern Analysis
 * Detects synthetic GPS signals: unnaturally uniform micro-drifts typical of emulators
 * Real GPS has chaotic noise; spoofed GPS drifts in suspiciously regular patterns
 */
function detectGPSDriftPattern(locationHistory) {
  if (!locationHistory || locationHistory.length < 5) return { flagged: false };

  const drifts = [];
  for (let i = 1; i < locationHistory.length; i++) {
    const dist = calculateHaversineDistance(
      locationHistory[i - 1].lat, locationHistory[i - 1].lon,
      locationHistory[i].lat, locationHistory[i].lon
    ) * 1000; // convert to meters
    drifts.push(dist);
  }

  // Calculate variance of consecutive drifts
  const mean = drifts.reduce((a, b) => a + b, 0) / drifts.length;
  const variance = drifts.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / drifts.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean > 0 ? stdDev / mean : 0;

  // Real GPS: high variance (CoV > 0.3). Spoofed: suspiciously uniform (CoV < 0.1)
  const isSuspicious = coeffOfVariation < 0.1 && mean < 50; // tiny uniform jumps

  if (isSuspicious) {
    console.warn(`[FraudService] 🚨 GPS Drift Anomaly: CoV=${coeffOfVariation.toFixed(3)}, mean drift=${mean.toFixed(1)}m — synthetic pattern detected`);
  }

  return {
    flagged: isSuspicious,
    coeffOfVariation,
    meanDriftMeters: mean,
    detail: isSuspicious
      ? `Uniform GPS micro-drift detected (CoV: ${coeffOfVariation.toFixed(3)}). Emulator/spoofer pattern.`
      : 'GPS noise pattern appears natural'
  };
}

/**
 * Teleportation Detection
 * Flags when a user "jumps" to a different zone instantaneously
 */
function detectTeleportation(locationHistory, claimedZone) {
  if (!locationHistory || locationHistory.length === 0 || !claimedZone) return { flagged: false };

  const zoneCoords = ZONE_COORDINATES[claimedZone];
  if (!zoneCoords) return { flagged: false };

  // Check if the user's most recent location is actually near the claimed zone
  const latest = locationHistory[0];
  const distFromZone = calculateHaversineDistance(latest.lat, latest.lon, zoneCoords.lat, zoneCoords.lon);

  // If user is more than 15km from claimed zone center, suspicious
  const isTeleported = distFromZone > 15;

  if (isTeleported) {
    console.warn(`[FraudService] 🚨 Teleportation: User is ${distFromZone.toFixed(1)}km from claimed zone ${claimedZone}`);
  }

  return {
    flagged: isTeleported,
    distanceFromZoneKm: distFromZone,
    detail: isTeleported
      ? `User location is ${distFromZone.toFixed(1)}km from ${claimedZone} (max: 15km)`
      : `User is within ${claimedZone} zone`
  };
}

/**
 * Device Sensor Verification
 * If GPS says moving but accelerometer variance is near-zero → emulator
 */
function verifyDeviceSensors(sensorData) {
  if (!sensorData) return { flagged: false, detail: 'No sensor data provided' };

  const flags = [];

  // GPS moving but device stationary (accelerometer flat)
  if (sensorData.accelerometerVar < 0.1 && sensorData.isGPSMoving) {
    flags.push({
      type: 'SENSOR_MISMATCH',
      detail: `Accelerometer variance ${sensorData.accelerometerVar} while GPS reports movement — emulator suspected`
    });
  }

  // Gyroscope perfectly stable (real phones always have micro-rotation)
  if (sensorData.gyroscopeVar !== undefined && sensorData.gyroscopeVar < 0.01) {
    flags.push({
      type: 'GYRO_FLATLINE',
      detail: `Gyroscope variance ${sensorData.gyroscopeVar} is impossibly stable — synthetic environment`
    });
  }

  return {
    flagged: flags.length > 0,
    flags,
    detail: flags.length > 0 ? flags.map(f => f.detail).join('; ') : 'Sensor data consistent'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: FAKE WEATHER CLAIM DETECTION (Historical Data Cross-Reference)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifies a trigger event against historical weather data from Open-Meteo.
 * If the claimed trigger (e.g. heavy rain) didn't actually occur in that zone
 * at that time, the claim is flagged as fraudulent.
 *
 * @param {string} triggerType - RAIN | AQI | OUTAGE
 * @param {string} zone       - Zone name
 * @param {Date}   eventTime  - When the trigger supposedly occurred
 */
async function verifyTriggerAgainstHistoricalData(triggerType, zone, eventTime) {
  const coords = ZONE_COORDINATES[zone];
  if (!coords) return { verified: true, detail: 'Zone not in coordinate map — skipping' };

  // For OUTAGE triggers, we can't verify via weather — skip
  if (triggerType === 'OUTAGE') return { verified: true, detail: 'Outage triggers bypass weather verification' };

  const eventDate = new Date(eventTime);
  const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const hour = eventDate.getHours();

  try {
    // Query Open-Meteo historical archive for that specific date
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        hourly: 'precipitation,temperature_2m',
        start_date: dateStr,
        end_date: dateStr,
        timezone: 'Asia/Kolkata'
      }
    });

    const hourlyData = weatherRes.data?.hourly;
    if (!hourlyData || !hourlyData.precipitation) {
      return { verified: true, detail: 'Could not fetch hourly data — allowing claim' };
    }

    const actualRain = hourlyData.precipitation[hour] || 0;
    const actualTemp = hourlyData.temperature_2m?.[hour] || 25;

    if (triggerType === 'RAIN') {
      // Claim says heavy rain, but API says 0mm? Fraud.
      if (actualRain < 1) {
        console.warn(`[FraudService] 🚨 FAKE WEATHER CLAIM: RAIN trigger in ${zone} at ${dateStr} hour ${hour}, but actual precipitation was ${actualRain}mm`);
        return {
          verified: false,
          detail: `No significant rainfall recorded in ${zone} (actual: ${actualRain}mm at hour ${hour}). Claim appears fraudulent.`,
          actualRain,
          actualTemp
        };
      }
    }

    if (triggerType === 'AQI') {
      // We can do a similar check with AQI historical data
      try {
        const aqiRes = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
          params: {
            latitude: coords.lat,
            longitude: coords.lon,
            hourly: 'us_aqi',
            start_date: dateStr,
            end_date: dateStr,
            timezone: 'Asia/Kolkata'
          }
        });

        const actualAqi = aqiRes.data?.hourly?.us_aqi?.[hour] || 0;

        if (actualAqi < 150) {
          console.warn(`[FraudService] 🚨 FAKE AQI CLAIM: AQI trigger in ${zone} at ${dateStr} hour ${hour}, but actual AQI was ${actualAqi}`);
          return {
            verified: false,
            detail: `AQI was only ${actualAqi} in ${zone} at hour ${hour} (threshold: 300+). Claim appears fraudulent.`,
            actualAqi
          };
        }
      } catch {
        // AQI API failure — allow claim through
      }
    }

    return {
      verified: true,
      detail: `Weather data confirmed: ${triggerType} conditions existed in ${zone}`,
      actualRain,
      actualTemp
    };
  } catch (error) {
    console.error(`[FraudService] Historical data fetch failed: ${error.message}`);
    return { verified: true, detail: 'Historical verification unavailable — allowing claim' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: BEHAVIORAL ANOMALY & RING DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Checks if a user has an abnormally high claim frequency.
 * If a worker files claims significantly more than peers in the same zone, flag it.
 *
 * @param {number} userId
 * @param {number} lookbackDays — how many days to look back (default 30)
 */
async function checkClaimFrequencyAnomaly(userId, lookbackDays = 30) {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // Count user's claims in the window
  const userClaimCount = await prisma.claim.count({
    where: {
      userId,
      createdAt: { gte: since }
    }
  });

  // Get the user's zone
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.zone) return { flagged: false, userClaimCount };

  // Get average claim count for all workers in the same zone
  const zonePeers = await prisma.user.findMany({
    where: { zone: user.zone, role: 'WORKER', id: { not: userId } },
    select: { id: true }
  });

  if (zonePeers.length === 0) return { flagged: false, userClaimCount, detail: 'No peers for comparison' };

  const peerIds = zonePeers.map(p => p.id);
  const totalPeerClaims = await prisma.claim.count({
    where: {
      userId: { in: peerIds },
      createdAt: { gte: since }
    }
  });

  const avgPeerClaims = totalPeerClaims / peerIds.length;

  // If user has 3x more claims than the zone average, flag
  const ratio = avgPeerClaims > 0 ? userClaimCount / avgPeerClaims : 0;
  const isSuspicious = userClaimCount > 3 && ratio > 3;

  if (isSuspicious) {
    console.warn(`[FraudService] 🚨 Claim Frequency Anomaly: User ${userId} has ${userClaimCount} claims vs zone avg ${avgPeerClaims.toFixed(1)} (${ratio.toFixed(1)}x)`);
  }

  return {
    flagged: isSuspicious,
    userClaimCount,
    zoneAverage: avgPeerClaims,
    ratio,
    detail: isSuspicious
      ? `User has ${ratio.toFixed(1)}x more claims than zone average (${userClaimCount} vs ${avgPeerClaims.toFixed(1)})`
      : 'Claim frequency within normal range'
  };
}

/**
 * Max-Payout Harvesting Detection
 * Flags users whose claims consistently hit the maximum payout cap — 
 * suggests the worker is gaming earnings input to maximize payouts.
 */
async function checkMaxPayoutHarvesting(userId) {
  const recentClaims = await prisma.claim.findMany({
    where: { userId },
    include: { policy: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (recentClaims.length < 3) return { flagged: false };

  let maxHitCount = 0;
  for (const claim of recentClaims) {
    if (claim.payoutAmount >= claim.policy.maxWeeklyPayout * 0.95) {
      maxHitCount++;
    }
  }

  const ratio = maxHitCount / recentClaims.length;
  const isSuspicious = ratio > 0.7 && recentClaims.length >= 3;

  if (isSuspicious) {
    console.warn(`[FraudService] 🚨 Max-Payout Harvesting: User ${userId} hit max cap on ${maxHitCount}/${recentClaims.length} recent claims`);
  }

  return {
    flagged: isSuspicious,
    maxHitCount,
    totalClaims: recentClaims.length,
    ratio,
    detail: isSuspicious
      ? `${maxHitCount}/${recentClaims.length} claims hit the max payout cap — potential earnings manipulation`
      : 'Payout distribution appears normal'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: COMPREHENSIVE FRAUD ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Runs the full fraud detection pipeline on a claim.
 * Returns a fraud report with an overall risk score.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.triggerType
 * @param {string} params.zone
 * @param {Date}   params.eventTime
 * @param {Array}  [params.locationHistory] — if available from device
 * @param {Object} [params.sensorData] — if available from device
 */
async function runFraudAssessment({ userId, triggerType, zone, eventTime, locationHistory, sensorData }) {
  const report = {
    userId,
    zone,
    triggerType,
    timestamp: new Date().toISOString(),
    checks: {},
    overallScore: 0,    // 0 = clean, 1 = definite fraud
    verdict: 'CLEAN'     // CLEAN | SUSPICIOUS | BLOCKED
  };

  let totalWeight = 0;
  let weightedFraudScore = 0;

  // 1. Historical Weather Cross-Reference (weight: 40%)
  const weatherCheck = await verifyTriggerAgainstHistoricalData(triggerType, zone, eventTime);
  report.checks.historicalWeather = weatherCheck;
  if (!weatherCheck.verified) {
    weightedFraudScore += 0.4 * 1.0;
  }
  totalWeight += 0.4;

  // 2. Claim Frequency Anomaly (weight: 25%)
  const freqCheck = await checkClaimFrequencyAnomaly(userId);
  report.checks.claimFrequency = freqCheck;
  if (freqCheck.flagged) {
    weightedFraudScore += 0.25 * Math.min(1, (freqCheck.ratio || 0) / 5);
  }
  totalWeight += 0.25;

  // 3. Max-Payout Harvesting (weight: 15%)
  const harvestCheck = await checkMaxPayoutHarvesting(userId);
  report.checks.maxPayoutHarvesting = harvestCheck;
  if (harvestCheck.flagged) {
    weightedFraudScore += 0.15 * (harvestCheck.ratio || 0);
  }
  totalWeight += 0.15;

  // 4. GPS Velocity (weight: 10%) — only if location data available
  if (locationHistory && locationHistory.length >= 2) {
    const velocityCheck = isVelocityAnomalous(locationHistory);
    report.checks.gpsVelocity = velocityCheck;
    if (velocityCheck.flagged) {
      weightedFraudScore += 0.1 * velocityCheck.confidence;
    }
    totalWeight += 0.1;

    // 4b. GPS Drift Pattern
    const driftCheck = detectGPSDriftPattern(locationHistory);
    report.checks.gpsDrift = driftCheck;
    if (driftCheck.flagged) {
      weightedFraudScore += 0.05;
    }
    totalWeight += 0.05;

    // 4c. Teleportation
    const teleportCheck = detectTeleportation(locationHistory, zone);
    report.checks.teleportation = teleportCheck;
    if (teleportCheck.flagged) {
      weightedFraudScore += 0.05;
    }
    totalWeight += 0.05;
  }

  // 5. Device Sensor (weight: 5%) — only if sensor data available
  if (sensorData) {
    const sensorCheck = verifyDeviceSensors(sensorData);
    report.checks.deviceSensor = sensorCheck;
    if (sensorCheck.flagged) {
      weightedFraudScore += 0.05;
    }
    totalWeight += 0.05;
  }

  // Normalize score
  report.overallScore = totalWeight > 0 ? weightedFraudScore / totalWeight : 0;

  // Classify verdict
  if (report.overallScore >= 0.6) {
    report.verdict = 'BLOCKED';
  } else if (report.overallScore >= 0.3) {
    report.verdict = 'SUSPICIOUS';
  } else {
    report.verdict = 'CLEAN';
  }

  console.log(`[FraudService] Assessment for User ${userId}: Score=${report.overallScore.toFixed(3)} → ${report.verdict}`);

  return report;
}

module.exports = {
  calculateHaversineDistance,
  isVelocityAnomalous,
  detectGPSDriftPattern,
  detectTeleportation,
  verifyDeviceSensors,
  verifyTriggerAgainstHistoricalData,
  checkClaimFrequencyAnomaly,
  checkMaxPayoutHarvesting,
  runFraudAssessment
};
