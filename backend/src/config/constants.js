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

const RISK_WEIGHTS = {
  rainfall: 0.4,
  aqi: 0.25,
  disruptionFrequency: 0.35
};

const RISK_LEVELS = {
  MEDIUM: 0.4,
  HIGH: 0.7
};

const PREMIUM_RISK_MULTIPLIER = {
  LOW: 0.85,
  MEDIUM: 1.05,
  HIGH: 1.25
};

const PLATFORM_LOADING = {
  ZOMATO: 1.06,
  SWIGGY: 1
};

module.exports = {
  PLAN_CONFIG,
  ZONE_RISK_MAP,
  PLATFORM_RELIABILITY,
  PAYOUT_PERCENTAGE,
  RISK_WEIGHTS,
  RISK_LEVELS,
  PREMIUM_RISK_MULTIPLIER,
  PLATFORM_LOADING
};
