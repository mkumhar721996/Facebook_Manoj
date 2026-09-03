const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDashboardSummary } = require('./dashboardService');

const TODAY = '2026-09-03';

function task(overrides) {
  return {
    id: overrides.id,
    userId: 'u1',
    title: overrides.title || overrides.id,
    completed: overrides.completed || false,
    dueDate: overrides.dueDate === undefined ? null : overrides.dueDate,
  };
}

test('AC1: computes total, completed, pending, overdue counts', () => {
  const tasks = [
    task({ id: 't1', completed: true, dueDate: '2026-08-01' }), // completed
    task({ id: 't2', completed: false, dueDate: '2026-09-10' }), // pending, future
    task({ id: 't3', completed: false, dueDate: '2026-08-01' }), // pending, overdue
    task({ id: 't4', completed: false, dueDate: null }), // pending, no due date
  ];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.equal(summary.totalCount, 4);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.pendingCount, 3);
  assert.equal(summary.overdueCount, 1);
});

test('AC2: upcoming preview includes only incomplete tasks due within 7 days, sorted ascending', () => {
  const tasks = [
    task({ id: 't5', completed: false, dueDate: '2026-09-08' }), // +5 days
    task({ id: 't6', completed: false, dueDate: '2026-09-04' }), // +1 day
    task({ id: 't7', completed: true, dueDate: '2026-09-05' }), // completed, excluded
    task({ id: 't8', completed: false, dueDate: '2026-09-06' }), // +3 days
  ];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.deepEqual(
    summary.upcoming.map((t) => t.id),
    ['t6', 't8', 't5']
  );
});

test('AC3: upcoming preview is empty when nothing is due within 7 days', () => {
  const tasks = [
    task({ id: 't9', completed: false, dueDate: null }),
    task({ id: 't10', completed: false, dueDate: '2026-09-20' }),
    task({ id: 't11', completed: true, dueDate: '2026-09-04' }),
  ];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.deepEqual(summary.upcoming, []);
});

test('AC4: overdue count is zero when there are no qualifying tasks', () => {
  const tasks = [
    task({ id: 't12', completed: true, dueDate: '2026-08-01' }),
    task({ id: 't13', completed: false, dueDate: '2026-09-10' }),
    task({ id: 't14', completed: false, dueDate: null }),
  ];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.equal(summary.overdueCount, 0);
});

test('AC5: incomplete task with no due date is excluded from upcoming and overdue', () => {
  const tasks = [task({ id: 't15', completed: false, dueDate: null })];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.equal(summary.totalCount, 1);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.overdueCount, 0);
  assert.deepEqual(summary.upcoming, []);
});

test('AC6: incomplete task due exactly today is not overdue', () => {
  const tasks = [task({ id: 't16', completed: false, dueDate: TODAY })];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.equal(summary.overdueCount, 0);
});

test('AC7: incomplete task due exactly 7 days from today appears in upcoming', () => {
  const tasks = [task({ id: 't17', completed: false, dueDate: '2026-09-10' })];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.deepEqual(
    summary.upcoming.map((t) => t.id),
    ['t17']
  );
});

test('AC8: incomplete task due 8 days from today does not appear in upcoming', () => {
  const tasks = [task({ id: 't18', completed: false, dueDate: '2026-09-11' })];

  const summary = buildDashboardSummary(tasks, TODAY);

  assert.deepEqual(summary.upcoming, []);
});
