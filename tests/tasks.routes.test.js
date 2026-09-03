const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const taskStore = require('../src/models/taskStore');

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
    const toggleRes = await fetch(`${baseUrl}/api/tasks/t1/toggle`, { method: 'PATCH' });
    assert.equal(toggleRes.status, 200);
    const toggleBody = await toggleRes.json();
    assert.equal(toggleBody.completed, true);

    const listRes = await fetch(`${baseUrl}/api/tasks`);
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
    const toggleRes = await fetch(`${baseUrl}/api/tasks/t2/toggle`, { method: 'PATCH' });
    assert.equal(toggleRes.status, 200);
    const toggleBody = await toggleRes.json();
    assert.equal(toggleBody.completed, false);

    const listRes = await fetch(`${baseUrl}/api/tasks`);
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
    const deleteRes = await fetch(`${baseUrl}/api/tasks/t3`, { method: 'DELETE' });
    assert.equal(deleteRes.status, 204);

    const listRes = await fetch(`${baseUrl}/api/tasks`);
    const list = await listRes.json();
    assert.equal(list.find((t) => t.id === 't3'), undefined);

    const secondDeleteRes = await fetch(`${baseUrl}/api/tasks/t3`, { method: 'DELETE' });
    assert.equal(secondDeleteRes.status, 404);
  } finally {
    await stopServer(server);
  }
});
