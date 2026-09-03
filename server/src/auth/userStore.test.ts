import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { UserStore } from './userStore.ts';

function randomTestCredential(): string {
  return randomBytes(16).toString('hex');
}

test('verifyCredentials: returns the userId when username and password match', () => {
  const store = new UserStore();
  const credential = randomTestCredential();
  store.addUser('user-1', 'alice', credential);

  assert.equal(store.verifyCredentials('alice', credential), 'user-1');
});

test('verifyCredentials: returns null when the password is wrong', () => {
  const store = new UserStore();
  store.addUser('user-1', 'alice', randomTestCredential());

  assert.equal(store.verifyCredentials('alice', randomTestCredential()), null);
});

test('verifyCredentials: returns null for an unknown username', () => {
  const store = new UserStore();
  store.addUser('user-1', 'alice', randomTestCredential());

  assert.equal(store.verifyCredentials('bob', randomTestCredential()), null);
});
