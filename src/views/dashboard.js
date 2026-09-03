function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderUpcomingSection(upcoming) {
  if (upcoming.length === 0) {
    return '<p data-testid="upcoming-empty">No tasks due in the next 7 days.</p>';
  }

  const items = upcoming
    .map(
      (t) =>
        `<li data-testid="upcoming-item" data-due-date="${escapeHtml(t.dueDate)}">${escapeHtml(
          t.title
        )} (due ${escapeHtml(t.dueDate)})</li>`
    )
    .join('');

  return `<ul data-testid="upcoming-list">${items}</ul>`;
}

function renderDashboard(summary) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Dashboard</title></head>
<body>
  <h1>Dashboard</h1>
  <section data-testid="summary-counts">
    <p>Total: <span data-testid="total-count">${summary.totalCount}</span></p>
    <p>Completed: <span data-testid="completed-count">${summary.completedCount}</span></p>
    <p>Pending: <span data-testid="pending-count">${summary.pendingCount}</span></p>
    <p>Overdue: <span data-testid="overdue-count">${summary.overdueCount}</span></p>
  </section>
  <section data-testid="upcoming-section">
    <h2>Upcoming (next 7 days)</h2>
    ${renderUpcomingSection(summary.upcoming)}
  </section>
</body>
</html>`;
}

module.exports = { renderDashboard };
