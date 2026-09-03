import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.ts';
import { TaskRepository } from './tasks/taskRepository.ts';
import type { Task } from './tasks/task.types.ts';

const USER = 'user-1';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'id-1',
    userId: overrides.userId ?? USER,
    title: overrides.title ?? 'Untitled',
    description: overrides.description ?? '',
    status: overrides.status ?? 'incomplete',
    priority: overrides.priority ?? 'low',
    tags: overrides.tags ?? [],
    category: overrides.category ?? 'general',
    dueDate: overrides.dueDate ?? null,
  };
}

async function withServer(
  tasks: Task[],
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const repository = new TaskRepository(tasks);
  const server = createApp(repository);
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

test('GET /api/tasks?search=foo returns only matching tasks', async () => {
  const tasks = [
    makeTask({ id: 'a', title: 'Foo task' }),
    makeTask({ id: 'b', title: 'Bar task' }),
  ];

  await withServer(tasks, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks?search=foo`, {
      headers: { 'x-user-id': USER },
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
      headers: { 'x-user-id': USER },
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
      headers: { 'x-user-id': USER },
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
      headers: { 'x-user-id': USER },
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
      headers: { 'x-user-id': USER },
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
      { headers: { 'x-user-id': USER } },
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
      { headers: { 'x-user-id': USER } },
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
      headers: { 'x-user-id': USER },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
  });
});

test('GET /api/tasks without auth header returns 401', async () => {
  await withServer([], async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(response.status, 401);
  });
});
