import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchTasks } from './api.ts';

test('fetchTasks: requests /api/tasks with the built query string and returns the tasks', async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    return {
      json: async () => [{ id: 'a' }],
    } as Response;
  }) as typeof fetch;

  try {
    const tasks = await fetchTasks({ search: 'foo' });
    assert.deepEqual(calls, ['/api/tasks?search=foo']);
    assert.deepEqual(tasks, [{ id: 'a' }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchTasks: requests /api/tasks with no query string when there are no filters', async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    return { json: async () => [] } as Response;
  }) as typeof fetch;

  try {
    await fetchTasks({});
    assert.deepEqual(calls, ['/api/tasks']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
