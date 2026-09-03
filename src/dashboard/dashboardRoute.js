const store = require('../store');
const { buildDashboardSummary } = require('./dashboardService');
const { renderDashboard } = require('../views/dashboard');
const { toDateOnly } = require('../dateUtils');

function handleDashboardRequest(userId) {
  const tasks = store.getTasksForUser(userId);
  const today = toDateOnly(new Date());
  const summary = buildDashboardSummary(tasks, today);
  return renderDashboard(summary);
}

module.exports = { handleDashboardRequest };
