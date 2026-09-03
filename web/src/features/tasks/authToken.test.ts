import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAuthToken, setAuthToken } from './authToken.ts';

test('authToken: starts with no token set', () => {
  assert.equal(getAuthToken(), null);
});

test('authToken: setAuthToken stores the token for later retrieval', () => {
  setAuthToken('abc.def');
  assert.equal(getAuthToken(), 'abc.def');
  setAuthToken(null);
});
