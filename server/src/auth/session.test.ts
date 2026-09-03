import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken } from './session.ts';

test('verifySessionToken: returns the userId for a token issued by createSessionToken', () => {
  const token = createSessionToken('user-1');
  assert.equal(verifySessionToken(token), 'user-1');
});

test('verifySessionToken: rejects a token with a tampered payload', () => {
  const token = createSessionToken('user-1');
  const [, signature] = token.split('.');
  const tampered = `${Buffer.from('user-2').toString('base64url')}.${signature}`;
  assert.equal(verifySessionToken(tampered), null);
});

test('verifySessionToken: rejects a token with a forged signature', () => {
  const token = createSessionToken('user-1');
  const [payload] = token.split('.');
  const forged = `${payload}.not-a-real-signature`;
  assert.equal(verifySessionToken(forged), null);
});

test('verifySessionToken: rejects malformed tokens', () => {
  assert.equal(verifySessionToken('garbage'), null);
  assert.equal(verifySessionToken(''), null);
});
