// externalApiService.js
// Integrates with real Open-Meteo and Air Quality APIs

const axios = require('axios');

const ZONE_COORDINATES = {
  'Koramangala': { lat: 12.9279, lon: 77.6271 },
  'Indiranagar': { lat: 12.9784, lon: 77.6408 },
  'Whitefield': { lat: 12.9698, lon: 77.7499 },
  'HSR Layout': { lat: 12.9121, lon: 77.6446 },
  'Electronic City': { lat: 12.8399, lon: 77.6770 }
};

/**
 * Fetches real-time weather and AQI for a specific zone
 */
async function getRealTimeEnvironmentalData(zone) {
  const coords = ZONE_COORDINATES[zone];
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

    return {
      temperature,
      rain,
      aqi
    };
  } catch (error) {
    console.error(`[ExternalAPI] Error fetching data for ${zone}:`, error.message);
    // Return safe defaults on error
    return { temperature: 25, rain: 0, aqi: 100 };
  }
}

/**
 * Mocks platform outage via a simulated external service check
 * In a real app, this might hit Downdetector APIs or scraping scripts
 */
async function getPlatformOutageStatus() {
  // We simulate a ping to a health endpoint
  // 5% chance of a platform outage in the simulation
  const isOutage = Math.random() < 0.05;
  return isOutage;
}

module.exports = {
  ZONE_COORDINATES,
  getRealTimeEnvironmentalData,
  getPlatformOutageStatus
};
