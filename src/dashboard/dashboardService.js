const { toDateOnly, addDays } = require('../dateUtils');

const UPCOMING_WINDOW_DAYS = 7;

function isOverdue(t, today) {
  return !t.completed && t.dueDate !== null && t.dueDate < today;
}

function isUpcoming(t, today, windowEnd) {
  return !t.completed && t.dueDate !== null && t.dueDate >= today && t.dueDate <= windowEnd;
}

function buildDashboardSummary(tasks, today) {
  const windowEnd = toDateOnly(addDays(new Date(`${today}T00:00:00.000Z`), UPCOMING_WINDOW_DAYS));

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const overdueCount = tasks.filter((t) => isOverdue(t, today)).length;

  const upcoming = tasks
    .filter((t) => isUpcoming(t, today, windowEnd))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));

  return { totalCount, completedCount, pendingCount, overdueCount, upcoming };
}

module.exports = { buildDashboardSummary };
