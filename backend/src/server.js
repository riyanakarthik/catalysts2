require('dotenv').config();
const cors = require('cors');
const express = require('express');
const authMiddleware = require('./middleware/authMiddleware');

const userRoutes = require('./routes/userRoutes');
const policyRoutes = require('./routes/policyRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const triggerRoutes = require('./routes/triggerRoutes');
const claimRoutes = require('./routes/claimRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require('./routes/dashboardRoutes');
const { getZoneRiskSnapshot } = require('./services/riskService');
const { initCronJobs } = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', app: 'Untitled backend' });
});

app.use('/api/users', userRoutes);
app.use('/api/policies', authMiddleware, policyRoutes);
app.use('/api/premium', authMiddleware, premiumRoutes);
app.use('/api/triggers', authMiddleware, triggerRoutes);
app.use('/api/claims', authMiddleware, claimRoutes);
app.use("/api/payment", authMiddleware, paymentRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

app.get('/api/risk/:zone', authMiddleware, async (req, res) => {
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
