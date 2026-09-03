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

  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  const upcoming = [];

  for (const t of tasks) {
    if (t.completed) {
      completedCount += 1;
      continue;
    }
    pendingCount += 1;
    if (isOverdue(t, today)) {
      overdueCount += 1;
    } else if (isUpcoming(t, today, windowEnd)) {
      upcoming.push(t);
    }
  }

  upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));

  return { totalCount: tasks.length, completedCount, pendingCount, overdueCount, upcoming };
}

module.exports = { buildDashboardSummary };
