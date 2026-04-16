const axios = require('axios');
const { ZONE_COORDINATES, normalizeZoneName } = require('../config/zones');

async function getRealTimeEnvironmentalData(zone) {
  const normalizedZone = normalizeZoneName(zone);
  const coords = ZONE_COORDINATES[normalizedZone];
  if (!coords) {
    throw new Error(`Coordinates not found for zone: ${zone}`);
  }

  try {
    // Current weather (temperature, rain)
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        current: 'temperature_2m,precipitation',
        timezone: 'Asia/Kolkata'
      }
    });

    // Current AQI
    const aqiRes = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        current: 'us_aqi',
        timezone: 'Asia/Kolkata'
      }
    });

    const temperature = weatherRes.data?.current?.temperature_2m || 0;
    const rain = weatherRes.data?.current?.precipitation || 0; // mm
    const aqi = aqiRes.data?.current?.us_aqi || 0;

    const disruptionFrequency = Number(
      Math.min(10, Math.max(1, (rain > 8 ? 6 : 3) + (aqi > 180 ? 2 : 0) + (temperature > 34 ? 1 : 0))).toFixed(1)
    );

    return {
      temperature,
      rain,
      rainfall: rain,
      aqi: Math.round(aqi),
      disruptionFrequency
    };
  } catch (error) {
    console.error(`[ExternalAPI] Error fetching data for ${normalizedZone}:`, error.message);
    const minuteSeed = new Date().getUTCMinutes();
    const zoneSeed = normalizedZone.length % 5;
    const rainfall = Number(((minuteSeed % 3) * 2 + zoneSeed).toFixed(1));
    const aqi = 110 + (zoneSeed * 20) + ((minuteSeed % 4) * 12);
    const disruptionFrequency = Number(Math.min(10, 3 + zoneSeed + (aqi > 180 ? 2 : 0)).toFixed(1));

    return {
      temperature: 25 + zoneSeed,
      rain: rainfall,
      rainfall,
      aqi,
      disruptionFrequency
    };
  }
}

// Simulated platform outage check used for prototype trigger automation.
async function getPlatformOutageStatus() {
  return new Date().getUTCMinutes() % 17 === 0;
}

module.exports = {
  ZONE_COORDINATES,
  getRealTimeEnvironmentalData,
  getPlatformOutageStatus
};
