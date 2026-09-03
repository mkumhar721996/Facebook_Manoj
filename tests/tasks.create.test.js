const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { startServer, stopServer } = require('./helpers/testServer');

let server;
let baseUrl;

test.before(async () => {
  ({ server, baseUrl } = await startServer());
});

test.after(async () => {
  await stopServer(server);
});

function newUserId() {
  return crypto.randomUUID();
}

test('AC1: creates a task with title and all optional fields, and it appears in the task list', async () => {
  const userId = newUserId();
  const payload = {
    title: 'Write the quarterly report',
    description: 'Summarize Q3 numbers',
    dueDate: '2026-09-30',
    priority: 'high',
    tags: ['work', 'urgent'],
    category: 'reports',
  };

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify(payload),
  });

  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.ok(created.id);
  assert.equal(created.title, payload.title);
  assert.equal(created.description, payload.description);
  assert.equal(created.dueDate, payload.dueDate);
  assert.equal(created.priority, payload.priority);
  assert.deepEqual(created.tags, payload.tags);
  assert.equal(created.category, payload.category);

  const listRes = await fetch(`${baseUrl}/tasks`, {
    headers: { 'x-user-id': userId },
  });
  assert.equal(listRes.status, 200);
  const tasks = await listRes.json();
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, created.id);
  assert.equal(tasks[0].title, payload.title);
});

test('AC4: defaults priority to medium when left unset', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: 'Task without a priority' }),
  });

  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.priority, 'medium');

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks[0].priority, 'medium');
});

test('AC2: rejects a missing title with a validation error and does not save the task', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ description: 'No title here' }),
  });

  assert.equal(createRes.status, 400);
  const result = await createRes.json();
  assert.ok(result.errors.some((e) => e.field === 'title'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks.length, 0);
});

test('AC3: rejects more than 5 tags with a validation error and does not save the task', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: 'Too many tags', tags: ['a', 'b', 'c', 'd', 'e', 'f'] }),
  });

  assert.equal(createRes.status, 400);
  const result = await createRes.json();
  assert.ok(result.errors.some((e) => e.field === 'tags'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks.length, 0);
});

test('AC7: saves a task successfully with exactly 5 tags', async () => {
  const userId = newUserId();
  const tags = ['a', 'b', 'c', 'd', 'e'];

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: 'Exactly five tags', tags }),
  });

  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.deepEqual(created.tags, tags);

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.deepEqual(tasks[0].tags, tags);
});

test('AC5: rejects an impossible calendar date with a validation error and does not save the task', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: 'Bad due date', dueDate: '2024-02-30' }),
  });

  assert.equal(createRes.status, 400);
  const result = await createRes.json();
  assert.ok(result.errors.some((e) => e.field === 'dueDate'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks.length, 0);
});

test('AC5: rejects a non-date string as the due date with a validation error and does not save the task', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: 'Bad due date', dueDate: 'not-a-date' }),
  });

  assert.equal(createRes.status, 400);
  const result = await createRes.json();
  assert.ok(result.errors.some((e) => e.field === 'dueDate'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks.length, 0);
});

test('AC2: rejects an empty title with a validation error and does not save the task', async () => {
  const userId = newUserId();

  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ title: '' }),
  });

  assert.equal(createRes.status, 400);
  const result = await createRes.json();
  assert.ok(result.errors.some((e) => e.field === 'title'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { 'x-user-id': userId } });
  const tasks = await listRes.json();
  assert.equal(tasks.length, 0);
});
