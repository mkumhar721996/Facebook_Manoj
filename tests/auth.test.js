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

test('rejects requests with no Authorization header', async () => {
  const res = await fetch(`${baseUrl}/tasks`);
  assert.equal(res.status, 401);
});

test('rejects requests with an arbitrary, unsigned bearer token', async () => {
  const res = await fetch(`${baseUrl}/tasks`, {
    headers: { Authorization: 'Bearer some-other-users-id' },
  });
  assert.equal(res.status, 401);
});

test('rejects a forged token that reuses a valid signature with a different user id', async () => {
  const userId = newUserId();
  const token = authHeaders(userId).Authorization.slice('Bearer '.length);
  const [, signature] = token.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ userId: 'victim-user-id' })).toString('base64url');
  const forgedToken = `${forgedPayload}.${signature}`;

  const res = await fetch(`${baseUrl}/tasks`, {
    headers: { Authorization: `Bearer ${forgedToken}` },
  });

  assert.equal(res.status, 401);
});

test('accepts a validly signed token and scopes tasks to that user only', async () => {
  const userA = newUserId();
  const userB = newUserId();

  await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(userA) },
    body: JSON.stringify({ title: "User A's task" }),
  });

  const listResB = await fetch(`${baseUrl}/tasks`, { headers: { ...authHeaders(userB) } });
  assert.equal(listResB.status, 200);
  const tasksB = await listResB.json();
  assert.equal(tasksB.length, 0);
});
