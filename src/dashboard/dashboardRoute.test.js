const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const store = require('../store');
const { createApp } = require('../app');
const { toDateOnly, addDays } = require('../dateUtils');

function todayPlus(n) {
  return toDateOnly(addDays(new Date(), n));
}

function randomTestPassword() {
  return crypto.randomBytes(18).toString('base64url');
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

async function loginAs(base, userId, password) {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });
  const setCookie = res.headers.get('set-cookie');
  return { status: res.status, cookie: setCookie ? setCookie.split(';')[0] : null };
}

test.beforeEach(() => {
  store.reset();
});

test('AC1: dashboard page renders the four summary counts for the logged-in user', async () => {
  const password = randomTestPassword();
  store.addUser({ id: 'alice', password });
  store.addTask({ id: 't1', userId: 'alice', title: 'Done', completed: true, dueDate: todayPlus(-10) });
  store.addTask({ id: 't2', userId: 'alice', title: 'Pending future', completed: false, dueDate: todayPlus(3) });
  store.addTask({ id: 't3', userId: 'alice', title: 'Overdue', completed: false, dueDate: todayPlus(-2) });
  store.addTask({ id: 't4', userId: 'alice', title: 'No due date', completed: false, dueDate: null });

  await withServer(async (base) => {
    const { cookie } = await loginAs(base, 'alice', password);
    const res = await fetch(`${base}/dashboard`, { headers: { cookie } });
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.match(html, /data-testid="total-count">4</);
    assert.match(html, /data-testid="completed-count">1</);
    assert.match(html, /data-testid="pending-count">3</);
    assert.match(html, /data-testid="overdue-count">1</);
  });
});

test('AC2: dashboard page lists upcoming due tasks in ascending due-date order', async () => {
  const password = randomTestPassword();
  store.addUser({ id: 'bob', password });
  store.addTask({ id: 't1', userId: 'bob', title: 'Later', completed: false, dueDate: todayPlus(5) });
  store.addTask({ id: 't2', userId: 'bob', title: 'Soonest', completed: false, dueDate: todayPlus(1) });
  store.addTask({ id: 't3', userId: 'bob', title: 'Middle', completed: false, dueDate: todayPlus(3) });

  await withServer(async (base) => {
    const { cookie } = await loginAs(base, 'bob', password);
    const res = await fetch(`${base}/dashboard`, { headers: { cookie } });
    const html = await res.text();

    const titles = [...html.matchAll(/data-testid="upcoming-item"[^>]*>([^(]+)\(/g)].map((m) => m[1].trim());
    assert.deepEqual(titles, ['Soonest', 'Middle', 'Later']);
  });
});

test('AC3: dashboard shows an empty-state message when nothing is due within 7 days', async () => {
  const password = randomTestPassword();
  store.addUser({ id: 'carol', password });
  store.addTask({ id: 't1', userId: 'carol', title: 'Far future', completed: false, dueDate: todayPlus(20) });
  store.addTask({ id: 't2', userId: 'carol', title: 'No due date', completed: false, dueDate: null });

  await withServer(async (base) => {
    const { cookie } = await loginAs(base, 'carol', password);
    const res = await fetch(`${base}/dashboard`, { headers: { cookie } });
    const html = await res.text();

    assert.match(html, /data-testid="upcoming-empty"/);
    assert.doesNotMatch(html, /data-testid="upcoming-item"/);
  });
});

test('AC9: summary counts and preview list reflect only the requesting user\'s own tasks', async () => {
  const davePassword = randomTestPassword();
  const erinPassword = randomTestPassword();
  store.addUser({ id: 'dave', password: davePassword });
  store.addUser({ id: 'erin', password: erinPassword });
  store.addTask({ id: 't1', userId: 'dave', title: 'Dave pending', completed: false, dueDate: todayPlus(2) });
  store.addTask({ id: 't2', userId: 'dave', title: 'Dave done', completed: true, dueDate: todayPlus(-5) });
  store.addTask({ id: 't3', userId: 'erin', title: 'Erin pending', completed: false, dueDate: todayPlus(1) });
  store.addTask({ id: 't4', userId: 'erin', title: 'Erin overdue', completed: false, dueDate: todayPlus(-1) });
  store.addTask({ id: 't5', userId: 'erin', title: 'Erin done', completed: true, dueDate: todayPlus(-2) });

  await withServer(async (base) => {
    const { cookie: daveCookie } = await loginAs(base, 'dave', davePassword);
    const daveRes = await fetch(`${base}/dashboard`, { headers: { cookie: daveCookie } });
    const daveHtml = await daveRes.text();
    assert.match(daveHtml, /data-testid="total-count">2</);
    assert.match(daveHtml, /data-testid="completed-count">1</);
    assert.match(daveHtml, /data-testid="pending-count">1</);
    assert.match(daveHtml, /data-testid="overdue-count">0</);
    assert.match(daveHtml, /Dave pending/);
    assert.doesNotMatch(daveHtml, /Erin/);

    const { cookie: erinCookie } = await loginAs(base, 'erin', erinPassword);
    const erinRes = await fetch(`${base}/dashboard`, { headers: { cookie: erinCookie } });
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

test('security: rejects a forged x-user-id header naming a real user with no valid session', async () => {
  store.addUser({ id: 'alice', password: randomTestPassword() });
  store.addTask({ id: 't1', userId: 'alice', title: 'Secret task', completed: false, dueDate: todayPlus(1) });

  await withServer(async (base) => {
    const res = await fetch(`${base}/dashboard`, { headers: { 'x-user-id': 'alice' } });
    assert.equal(res.status, 401);
  });
});

test('security: rejects login with an incorrect password and issues no session', async () => {
  store.addUser({ id: 'alice', password: randomTestPassword() });

  await withServer(async (base) => {
    const { status, cookie } = await loginAs(base, 'alice', randomTestPassword());
    assert.equal(status, 401);
    assert.equal(cookie, null);
  });
});

test('security: rejects an oversized login body instead of buffering it unbounded', async () => {
  await withServer(async (base) => {
    const oversizedBody = JSON.stringify({ userId: 'a'.repeat(2 * 1024 * 1024), password: 'x' });
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversizedBody,
    });
    assert.equal(res.status, 413);
  });
});
