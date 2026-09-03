import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserStore } from './userStore.ts';

test('verifyCredentials: returns the userId when username and password match', () => {
  const store = new UserStore();
  store.addUser('user-1', 'alice', 'correct-horse-battery-staple');

  assert.equal(store.verifyCredentials('alice', 'correct-horse-battery-staple'), 'user-1');
});

test('verifyCredentials: returns null when the password is wrong', () => {
  const store = new UserStore();
  store.addUser('user-1', 'alice', 'correct-horse-battery-staple');

  assert.equal(store.verifyCredentials('alice', 'wrong-password'), null);
});

test('verifyCredentials: returns null for an unknown username', () => {
  const store = new UserStore();
  store.addUser('user-1', 'alice', 'correct-horse-battery-staple');

  assert.equal(store.verifyCredentials('bob', 'anything'), null);
});
