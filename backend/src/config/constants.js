const PLAN_CONFIG = {
  BASIC: { basePremium: 18, maxWeeklyPayout: 1800, coverage: ['RAIN', 'AQI'] },
  STANDARD: { basePremium: 35, maxWeeklyPayout: 3000, coverage: ['RAIN', 'AQI'] },
  PREMIUM: { basePremium: 55, maxWeeklyPayout: 4500, coverage: ['RAIN', 'AQI', 'OUTAGE'] }
};

const ZONE_RISK_MAP = {
  Koramangala: 'high',
  Indiranagar: 'medium',
  Whitefield: 'high',
  'HSR Layout': 'low',
  HSR: 'low',
  'Electronic City': 'medium',
  Marathahalli: 'medium',
  BTM: 'high',
};

const PLATFORM_RELIABILITY = {
  ZOMATO: 'outage-prone',
  SWIGGY: 'stable'
};

const PAYOUT_PERCENTAGE = {
  RAIN: 0.4,
  AQI: 0.3,
  OUTAGE: 0.5
};

module.exports = {
  PLAN_CONFIG,
  ZONE_RISK_MAP,
  PLATFORM_RELIABILITY,
  PAYOUT_PERCENTAGE
};
