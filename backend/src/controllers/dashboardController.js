const { getWorkerDashboard, getAdminDashboard } = require('../services/dashboardService');
const { t } = require('../services/i18nService');

async function getWorkerDashboardData(req, res) {
  try {
    const data = await getWorkerDashboard(req.user.userId);
    return res.json({
      message: t(req, 'workerDashboard'),
      data
    });
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
}

async function getAdminDashboardData(req, res) {
  try {
    const data = await getAdminDashboard();
    return res.json({
      message: t(req, 'adminDashboard'),
      data
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch admin dashboard' });
  }
}

module.exports = {
  getWorkerDashboardData,
  getAdminDashboardData
};
