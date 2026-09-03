const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { startServer, stopServer, authHeaders } = require('./helpers/testServer');

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

async function createTask(userId, payload) {
  const res = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(userId) },
    body: JSON.stringify(payload),
  });
  return res.json();
}

test('AC2: rejects clearing an existing title on edit and leaves the task unchanged', async () => {
  const userId = newUserId();
  const created = await createTask(userId, { title: 'Original title' });

  const updateRes = await fetch(`${baseUrl}/tasks/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(userId) },
    body: JSON.stringify({ title: '' }),
  });

  assert.equal(updateRes.status, 400);
  const result = await updateRes.json();
  assert.ok(result.errors.some((e) => e.field === 'title'));

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { ...authHeaders(userId) } });
  const tasks = await listRes.json();
  assert.equal(tasks[0].title, 'Original title');
});

test('AC6: updates every field on edit and reflects the changes in the task list', async () => {
  const userId = newUserId();
  const created = await createTask(userId, {
    title: 'Original title',
    description: 'Original description',
    dueDate: '2026-01-01',
    priority: 'low',
    tags: ['old'],
    category: 'personal',
  });

  const patch = {
    title: 'Updated title',
    description: 'Updated description',
    dueDate: '2026-12-25',
    priority: 'high',
    tags: ['new', 'tags'],
    category: 'work',
  };

  const updateRes = await fetch(`${baseUrl}/tasks/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(userId) },
    body: JSON.stringify(patch),
  });

  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.title, patch.title);
  assert.equal(updated.description, patch.description);
  assert.equal(updated.dueDate, patch.dueDate);
  assert.equal(updated.priority, patch.priority);
  assert.deepEqual(updated.tags, patch.tags);
  assert.equal(updated.category, patch.category);

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { ...authHeaders(userId) } });
  const tasks = await listRes.json();
  const listed = tasks.find((t) => t.id === created.id);
  assert.equal(listed.title, patch.title);
  assert.equal(listed.description, patch.description);
  assert.equal(listed.dueDate, patch.dueDate);
  assert.equal(listed.priority, patch.priority);
  assert.deepEqual(listed.tags, patch.tags);
  assert.equal(listed.category, patch.category);
});

test('rejects updating a task id that does not exist with a 404', async () => {
  const userId = newUserId();

  const updateRes = await fetch(`${baseUrl}/tasks/does-not-exist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(userId) },
    body: JSON.stringify({ title: 'Updated title' }),
  });

  assert.equal(updateRes.status, 404);
  const result = await updateRes.json();
  assert.ok(result.errors.some((e) => e.field === 'id'));
});

test('rejects an update to a task belonging to another user with a 404', async () => {
  const ownerId = newUserId();
  const attackerId = newUserId();
  const created = await createTask(ownerId, { title: 'Owner-only task' });

  const updateRes = await fetch(`${baseUrl}/tasks/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(attackerId) },
    body: JSON.stringify({ title: 'Hijacked title' }),
  });

  assert.equal(updateRes.status, 404);

  const listRes = await fetch(`${baseUrl}/tasks`, { headers: { ...authHeaders(ownerId) } });
  const tasks = await listRes.json();
  assert.equal(tasks[0].title, 'Owner-only task');
});
