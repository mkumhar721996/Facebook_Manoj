import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { getAuthenticatedUserId } from './requireAuth.ts';
import { createSessionToken } from './session.ts';

function makeRequest(headers: Record<string, string>): IncomingMessage {
  return { headers } as IncomingMessage;
}

test('getAuthenticatedUserId: returns the userId for a valid bearer token', () => {
  const token = createSessionToken('user-1');
  const req = makeRequest({ authorization: `Bearer ${token}` });

  assert.equal(getAuthenticatedUserId(req), 'user-1');
});

test('getAuthenticatedUserId: returns null when there is no authorization header', () => {
  const req = makeRequest({});
  assert.equal(getAuthenticatedUserId(req), null);
});

test('getAuthenticatedUserId: returns null for a client-supplied x-user-id header with no token', () => {
  const req = makeRequest({ 'x-user-id': 'victim-user' });
  assert.equal(getAuthenticatedUserId(req), null);
});

test('getAuthenticatedUserId: returns null for a forged bearer token', () => {
  const req = makeRequest({ authorization: 'Bearer forged.token' });
  assert.equal(getAuthenticatedUserId(req), null);
});
