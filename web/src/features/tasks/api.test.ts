import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { fetchTasks, login } from './api.ts';
import { getAuthToken, setAuthToken } from './authToken.ts';

function randomTestCredential(): string {
  return randomBytes(16).toString('hex');
}

function stubFetch(
  handler: (url: string, options?: RequestInit) => unknown,
  status = 200,
): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, options?: RequestInit) => {
    const result = handler(url, options);
    return { status, ok: status >= 200 && status < 300, json: async () => result } as Response;
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test('fetchTasks: requests /api/tasks with the built query string and returns the tasks', async () => {
  setAuthToken(null);
  const calls: string[] = [];
  const restore = stubFetch((url) => {
    calls.push(url);
    return [{ id: 'a' }];
  });

  try {
    const tasks = await fetchTasks({ search: 'foo' });
    assert.deepEqual(calls, ['/api/tasks?search=foo']);
    assert.deepEqual(tasks, [{ id: 'a' }]);
  } finally {
    restore();
  }
});

test('fetchTasks: requests /api/tasks with no query string when there are no filters', async () => {
  setAuthToken(null);
  const calls: string[] = [];
  const restore = stubFetch((url) => {
    calls.push(url);
    return [];
  });

  try {
    await fetchTasks({});
    assert.deepEqual(calls, ['/api/tasks']);
  } finally {
    restore();
  }
});

test('fetchTasks: sends the stored auth token as a bearer authorization header', async () => {
  setAuthToken('test-token');
  let capturedOptions: RequestInit | undefined;
  const restore = stubFetch((_url, options) => {
    capturedOptions = options;
    return [];
  });

  try {
    await fetchTasks({});
    const headers = capturedOptions?.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer test-token');
  } finally {
    setAuthToken(null);
    restore();
  }
});

test('fetchTasks: omits the authorization header when there is no token', async () => {
  setAuthToken(null);
  let capturedOptions: RequestInit | undefined;
  const restore = stubFetch((_url, options) => {
    capturedOptions = options;
    return [];
  });

  try {
    await fetchTasks({});
    const headers = (capturedOptions?.headers ?? {}) as Record<string, string>;
    assert.equal(headers.Authorization, undefined);
  } finally {
    restore();
  }
});

test('fetchTasks: throws and does not return the error body when the response is not ok', async () => {
  setAuthToken(null);
  const restore = stubFetch(() => ({ error: 'Unauthorized' }), 401);

  try {
    await assert.rejects(() => fetchTasks({}));
  } finally {
    restore();
  }
});

test('login: throws and does not store a token when the response is not ok', async () => {
  setAuthToken(null);
  const restore = stubFetch(() => ({ error: 'Invalid credentials' }), 401);

  try {
    await assert.rejects(() => login('alice', randomTestCredential()));
    assert.equal(getAuthToken(), null);
  } finally {
    setAuthToken(null);
    restore();
  }
});

test('login: posts credentials, stores the returned token, and returns it', async () => {
  let capturedUrl: string | undefined;
  let capturedOptions: RequestInit | undefined;
  const restore = stubFetch((url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return { token: 'issued-token' };
  });

  const credential = randomTestCredential();
  try {
    const token = await login('alice', credential);
    assert.equal(capturedUrl, '/api/login');
    assert.equal(capturedOptions?.method, 'POST');
    assert.deepEqual(JSON.parse(capturedOptions?.body as string), {
      username: 'alice',
      password: credential,
    });
    assert.equal(token, 'issued-token');
    assert.equal(getAuthToken(), 'issued-token');
  } finally {
    setAuthToken(null);
    restore();
  }
});
