import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createApp } from './app.ts';
import { TaskRepository } from './tasks/taskRepository.ts';
import { UserStore } from './auth/userStore.ts';
import { createSessionToken } from './auth/session.ts';
import { DEFAULT_TEST_USER_ID, makeTask } from './testing/taskFactory.ts';
import type { Task } from './tasks/task.types.ts';

function randomTestCredential(): string {
  return randomBytes(16).toString('hex');
}

const USER = DEFAULT_TEST_USER_ID;
const USERNAME = 'test-user';
const PASSWORD = randomTestCredential();

function makeUserStore(): UserStore {
  const userStore = new UserStore();
  userStore.addUser(USER, USERNAME, PASSWORD);
  return userStore;
}

async function withServer(
  tasks: Task[],
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const repository = new TaskRepository(tasks);
  const server = createApp(repository, makeUserStore());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected server to bind to a port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${createSessionToken(USER)}` };
}

test('GET /api/tasks?search=foo returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', title: 'Foo task' }),
    makeTask({ id: 'b', title: 'Bar task' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?search=foo`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('GET /api/tasks?status=complete returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', status: 'complete' }),
    makeTask({ id: 'b', status: 'incomplete' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?status=complete`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('GET /api/tasks?priority=high returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', priority: 'high' }),
    makeTask({ id: 'b', priority: 'low' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?priority=high`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('GET /api/tasks?tag=urgent returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', tags: ['urgent'] }),
    makeTask({ id: 'b', tags: ['home'] }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?tag=urgent`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('GET /api/tasks?category=work returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', category: 'work' }),
    makeTask({ id: 'b', category: 'home' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?category=work`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('GET /api/tasks?dueStart=...&dueEnd=... returns only tasks within range', async () => {
  const tasks = [
    makeTask({ id: 'a', dueDate: '2026-09-01' }),
    makeTask({ id: 'b', dueDate: '2026-09-05' }),
    makeTask({ id: 'c', dueDate: '2026-09-10' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/tasks?dueStart=2026-09-05&dueEnd=2026-09-10`,
      { headers: authHeaders() },
    );
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['b', 'c'],
    );
  });
});

test('GET /api/tasks with multiple filters combined returns only tasks matching all of them', async () => {
  const tasks = [
    makeTask({ id: 'match', title: 'Foo task', status: 'incomplete', priority: 'high' }),
    makeTask({ id: 'wrong-status', title: 'Foo task', status: 'complete', priority: 'high' }),
    makeTask({ id: 'wrong-priority', title: 'Foo task', status: 'incomplete', priority: 'low' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/tasks?search=foo&status=incomplete&priority=high`,
      { headers: authHeaders() },
    );
    const body = await response.json();

    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['match'],
    );
  });
});

test('GET /api/tasks returns an empty array when no tasks match the filters', async () => {
  const tasks = [makeTask({ id: 'a', title: 'Foo task' })];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?search=doesnotexist`, {
      headers: authHeaders(),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
  });
});

test('GET /api/tasks without an authorization header returns 401', async () => {
  await withServer([], async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(response.status, 401);
  });
});

test('GET /api/tasks with a client-supplied x-user-id header but no token is rejected', async () => {
  const tasks = [makeTask({ id: 'a', userId: USER })];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      headers: { 'x-user-id': USER },
    });
    assert.equal(response.status, 401);
  });
});

test('GET /api/tasks with a forged bearer token is rejected', async () => {
  await withServer([], async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      headers: { Authorization: 'Bearer forged.signature' },
    });
    assert.equal(response.status, 401);
  });
});

test('POST /api/login with correct credentials returns a usable token', async () => {
  const tasks = [makeTask({ id: 'a', userId: USER })];

  await withServer(tasks, async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    assert.equal(loginResponse.status, 200);
    const { token } = await loginResponse.json();
    assert.equal(typeof token, 'string');

    const tasksResponse = await fetch(`${baseUrl}/api/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await tasksResponse.json();
    assert.equal(tasksResponse.status, 200);
    assert.deepEqual(
      body.map((t: Task) => t.id),
      ['a'],
    );
  });
});

test('POST /api/login with an incorrect password returns 401', async () => {
  await withServer([], async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: randomTestCredential() }),
    });
    assert.equal(response.status, 401);
  });
});
