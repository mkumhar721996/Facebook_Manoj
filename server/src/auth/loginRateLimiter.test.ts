import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginRateLimiter } from './loginRateLimiter.ts';

test('LoginRateLimiter: allows attempts up to the configured maximum', () => {
  const limiter = new LoginRateLimiter(60_000, 3);
  assert.equal(limiter.recordAttempt('1.2.3.4', 0), true);
  assert.equal(limiter.recordAttempt('1.2.3.4', 1), true);
  assert.equal(limiter.recordAttempt('1.2.3.4', 2), true);
});

test('LoginRateLimiter: rejects attempts beyond the configured maximum within the window', () => {
  const limiter = new LoginRateLimiter(60_000, 3);
  limiter.recordAttempt('1.2.3.4', 0);
  limiter.recordAttempt('1.2.3.4', 1);
  limiter.recordAttempt('1.2.3.4', 2);
  assert.equal(limiter.recordAttempt('1.2.3.4', 3), false);
});

test('LoginRateLimiter: tracks each key independently', () => {
  const limiter = new LoginRateLimiter(60_000, 1);
  assert.equal(limiter.recordAttempt('1.2.3.4', 0), true);
  assert.equal(limiter.recordAttempt('5.6.7.8', 0), true);
  assert.equal(limiter.recordAttempt('1.2.3.4', 1), false);
});

test('LoginRateLimiter: allows attempts again once the window has elapsed', () => {
  const limiter = new LoginRateLimiter(60_000, 1);
  assert.equal(limiter.recordAttempt('1.2.3.4', 0), true);
  assert.equal(limiter.recordAttempt('1.2.3.4', 30_000), false);
  assert.equal(limiter.recordAttempt('1.2.3.4', 60_001), true);
});
