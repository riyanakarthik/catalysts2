require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { requireAuth } = require('./middleware/authMiddleware');
const { getAllowedCorsOrigins, getRequiredEnv } = require('./config/env');

const userRoutes = require('./routes/userRoutes');
const policyRoutes = require('./routes/policyRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const triggerRoutes = require('./routes/triggerRoutes');
const claimRoutes = require('./routes/claimRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');
const { getZoneRiskSnapshot } = require('./services/riskService');
const { initCronJobs } = require('./services/cronService');

getRequiredEnv('DATABASE_URL');
getRequiredEnv('JWT_SECRET');
getRequiredEnv('RAZORPAY_KEY_ID');
getRequiredEnv('RAZORPAY_KEY_SECRET');

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = getAllowedCorsOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'Untitled backend' });
});

app.use('/api/users', userRoutes);
app.use('/api/policies', requireAuth, policyRoutes);
app.use('/api/premium', requireAuth, premiumRoutes);
app.use('/api/triggers', requireAuth, triggerRoutes);
app.use('/api/claims', requireAuth, claimRoutes);
app.use("/api/payment", requireAuth, paymentRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

app.get('/api/risk/:zone', requireAuth, async (req, res) => {
  try {
    const riskScore = await getZoneRiskSnapshot({ zone: req.params.zone });
    res.json(riskScore);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch risk score' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  initCronJobs();
});
