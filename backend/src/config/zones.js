const ZONE_COORDINATES = {
  Koramangala: { lat: 12.9279, lon: 77.6271 },
  Indiranagar: { lat: 12.9784, lon: 77.6408 },
  Whitefield: { lat: 12.9698, lon: 77.7499 },
  'HSR Layout': { lat: 12.9121, lon: 77.6446 },
  'Electronic City': { lat: 12.8399, lon: 77.6770 }
};

const ZONE_ALIASES = {
  HSR: 'HSR Layout',
  'HSR layout': 'HSR Layout',
  'hsr layout': 'HSR Layout'
};

function normalizeZoneName(zone) {
  if (!zone) return zone;

  const trimmedZone = String(zone).trim();
  return ZONE_ALIASES[trimmedZone] || trimmedZone;
}

function isSupportedZone(zone) {
  return Boolean(ZONE_COORDINATES[normalizeZoneName(zone)]);
}

module.exports = {
  ZONE_COORDINATES,
  normalizeZoneName,
  isSupportedZone
};
