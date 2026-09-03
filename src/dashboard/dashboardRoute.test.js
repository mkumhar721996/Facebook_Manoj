const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../store');
const { createApp } = require('../app');
const { toDateOnly, addDays } = require('../dateUtils');

function todayPlus(n) {
  return toDateOnly(addDays(new Date(), n));
}

async function withServer(fn) {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test.beforeEach(() => {
  store.reset();
});

test('AC1: dashboard page renders the four summary counts for the logged-in user', async () => {
  store.addUser({ id: 'alice' });
  store.addTask({ id: 't1', userId: 'alice', title: 'Done', completed: true, dueDate: todayPlus(-10) });
  store.addTask({ id: 't2', userId: 'alice', title: 'Pending future', completed: false, dueDate: todayPlus(3) });
  store.addTask({ id: 't3', userId: 'alice', title: 'Overdue', completed: false, dueDate: todayPlus(-2) });
  store.addTask({ id: 't4', userId: 'alice', title: 'No due date', completed: false, dueDate: null });

  await withServer(async (base) => {
    const res = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'alice' } });
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.match(html, /data-testid="total-count">4</);
    assert.match(html, /data-testid="completed-count">1</);
    assert.match(html, /data-testid="pending-count">3</);
    assert.match(html, /data-testid="overdue-count">1</);
  });
});

test('AC2: dashboard page lists upcoming due tasks in ascending due-date order', async () => {
  store.addUser({ id: 'bob' });
  store.addTask({ id: 't1', userId: 'bob', title: 'Later', completed: false, dueDate: todayPlus(5) });
  store.addTask({ id: 't2', userId: 'bob', title: 'Soonest', completed: false, dueDate: todayPlus(1) });
  store.addTask({ id: 't3', userId: 'bob', title: 'Middle', completed: false, dueDate: todayPlus(3) });

  await withServer(async (base) => {
    const res = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'bob' } });
    const html = await res.text();

    const titles = [...html.matchAll(/data-testid="upcoming-item"[^>]*>([^(]+)\(/g)].map((m) => m[1].trim());
    assert.deepEqual(titles, ['Soonest', 'Middle', 'Later']);
  });
});

test('AC3: dashboard shows an empty-state message when nothing is due within 7 days', async () => {
  store.addUser({ id: 'carol' });
  store.addTask({ id: 't1', userId: 'carol', title: 'Far future', completed: false, dueDate: todayPlus(20) });
  store.addTask({ id: 't2', userId: 'carol', title: 'No due date', completed: false, dueDate: null });

  await withServer(async (base) => {
    const res = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'carol' } });
    const html = await res.text();

    assert.match(html, /data-testid="upcoming-empty"/);
    assert.doesNotMatch(html, /data-testid="upcoming-item"/);
  });
});

test('AC9: summary counts and preview list reflect only the requesting user\'s own tasks', async () => {
  store.addUser({ id: 'dave' });
  store.addUser({ id: 'erin' });
  store.addTask({ id: 't1', userId: 'dave', title: 'Dave pending', completed: false, dueDate: todayPlus(2) });
  store.addTask({ id: 't2', userId: 'dave', title: 'Dave done', completed: true, dueDate: todayPlus(-5) });
  store.addTask({ id: 't3', userId: 'erin', title: 'Erin pending', completed: false, dueDate: todayPlus(1) });
  store.addTask({ id: 't4', userId: 'erin', title: 'Erin overdue', completed: false, dueDate: todayPlus(-1) });
  store.addTask({ id: 't5', userId: 'erin', title: 'Erin done', completed: true, dueDate: todayPlus(-2) });

  await withServer(async (base) => {
    const daveRes = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'dave' } });
    const daveHtml = await daveRes.text();
    assert.match(daveHtml, /data-testid="total-count">2</);
    assert.match(daveHtml, /data-testid="completed-count">1</);
    assert.match(daveHtml, /data-testid="pending-count">1</);
    assert.match(daveHtml, /data-testid="overdue-count">0</);
    assert.match(daveHtml, /Dave pending/);
    assert.doesNotMatch(daveHtml, /Erin/);

    const erinRes = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'erin' } });
    const erinHtml = await erinRes.text();
    assert.match(erinHtml, /data-testid="total-count">3</);
    assert.match(erinHtml, /data-testid="completed-count">1</);
    assert.match(erinHtml, /data-testid="pending-count">2</);
    assert.match(erinHtml, /data-testid="overdue-count">1</);
    assert.match(erinHtml, /Erin pending/);
    assert.doesNotMatch(erinHtml, /Dave/);
  });
});

test('rejects requests without a valid logged-in user', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/dashboard`);
    assert.equal(res.status, 401);
  });
});
