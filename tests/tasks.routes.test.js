const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const taskStore = require('../src/models/taskStore');

const AUTH_HEADERS = { Authorization: 'Bearer demo-session-token' };

function startServer() {
  const server = createApp();
  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('PATCH /api/tasks/:id/toggle flips an incomplete task to complete (AC1)', async () => {
  taskStore.reset([{ id: 't1', userId: 'demo-user', title: 'Buy milk', completed: false }]);
  const { server, baseUrl } = await startServer();
  try {
    const toggleRes = await fetch(`${baseUrl}/api/tasks/t1/toggle`, { method: 'PATCH', headers: AUTH_HEADERS });
    assert.equal(toggleRes.status, 200);
    const toggleBody = await toggleRes.json();
    assert.equal(toggleBody.completed, true);

    const listRes = await fetch(`${baseUrl}/api/tasks`, { headers: AUTH_HEADERS });
    const list = await listRes.json();
    const t1 = list.find((t) => t.id === 't1');
    assert.equal(t1.completed, true);
  } finally {
    await stopServer(server);
  }
});

test('PATCH /api/tasks/:id/toggle flips a complete task back to incomplete (AC2)', async () => {
  taskStore.reset([{ id: 't2', userId: 'demo-user', title: 'Walk dog', completed: true }]);
  const { server, baseUrl } = await startServer();
  try {
    const toggleRes = await fetch(`${baseUrl}/api/tasks/t2/toggle`, { method: 'PATCH', headers: AUTH_HEADERS });
    assert.equal(toggleRes.status, 200);
    const toggleBody = await toggleRes.json();
    assert.equal(toggleBody.completed, false);

    const listRes = await fetch(`${baseUrl}/api/tasks`, { headers: AUTH_HEADERS });
    const list = await listRes.json();
    const t2 = list.find((t) => t.id === 't2');
    assert.equal(t2.completed, false);
  } finally {
    await stopServer(server);
  }
});

test('DELETE /api/tasks/:id permanently removes the task (AC3)', async () => {
  taskStore.reset([{ id: 't3', userId: 'demo-user', title: 'Pay bills', completed: false }]);
  const { server, baseUrl } = await startServer();
  try {
    const deleteRes = await fetch(`${baseUrl}/api/tasks/t3`, { method: 'DELETE', headers: AUTH_HEADERS });
    assert.equal(deleteRes.status, 204);

    const listRes = await fetch(`${baseUrl}/api/tasks`, { headers: AUTH_HEADERS });
    const list = await listRes.json();
    assert.equal(list.find((t) => t.id === 't3'), undefined);

    const secondDeleteRes = await fetch(`${baseUrl}/api/tasks/t3`, { method: 'DELETE', headers: AUTH_HEADERS });
    assert.equal(secondDeleteRes.status, 404);
  } finally {
    await stopServer(server);
  }
});

test('API routes reject requests with no or invalid session token', async () => {
  taskStore.reset([{ id: 't5', userId: 'demo-user', title: 'Read book', completed: false }]);
  const { server, baseUrl } = await startServer();
  try {
    const noAuthRes = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(noAuthRes.status, 401);

    const badAuthRes = await fetch(`${baseUrl}/api/tasks`, { headers: { Authorization: 'Bearer not-a-real-token' } });
    assert.equal(badAuthRes.status, 401);
  } finally {
    await stopServer(server);
  }
});

test('GET / serves the static index.html shell', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    const body = await res.text();
    assert.match(body, /task-list/);
  } finally {
    await stopServer(server);
  }
});

test('GET /js/taskList.js serves the static frontend script', async () => {
  const { server, baseUrl } = await startServer();
  try {
    const res = await fetch(`${baseUrl}/js/taskList.js`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /function render/);
  } finally {
    await stopServer(server);
  }
});
