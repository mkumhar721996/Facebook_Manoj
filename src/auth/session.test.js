const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../store');
const session = require('./session');

test.beforeEach(() => {
  store.reset();
});

test('resolves the user id from a validly signed session cookie', () => {
  store.addUser({ id: 'alice' });
  const cookieHeader = session.createSessionCookie('alice');
  const token = cookieHeader.split(';')[0].split('=')[1];

  const req = { headers: { cookie: `session=${token}` } };

  assert.equal(session.resolveUserId(req), 'alice');
});

test('rejects a forged cookie that just names a valid user id with no valid signature', () => {
  store.addUser({ id: 'alice' });

  const req = { headers: { cookie: 'session=alice.deadbeef' } };

  assert.equal(session.resolveUserId(req), null);
});

test('rejects a session cookie whose signature was issued for a different user id', () => {
  store.addUser({ id: 'alice' });
  store.addUser({ id: 'mallory' });
  const cookieHeader = session.createSessionCookie('mallory');
  const token = cookieHeader.split(';')[0].split('=')[1];
  const forgedToken = token.replace('mallory', 'alice');

  const req = { headers: { cookie: `session=${forgedToken}` } };

  assert.equal(session.resolveUserId(req), null);
});

test('rejects when there is no session cookie at all', () => {
  store.addUser({ id: 'alice' });

  const req = { headers: {} };

  assert.equal(session.resolveUserId(req), null);
});

test('verifyCredentials returns false for a userId that does not exist', () => {
  assert.equal(session.verifyCredentials('nobody', 'whatever'), false);
});

test('verifyCredentials returns false for an existing user with the wrong password', () => {
  store.addUser({ id: 'alice', password: 'pw1' });

  assert.equal(session.verifyCredentials('alice', 'pw2'), false);
});

test('verifyCredentials returns true for an existing user with the correct password', () => {
  store.addUser({ id: 'alice', password: 'pw1' });

  assert.equal(session.verifyCredentials('alice', 'pw1'), true);
});

test('security: verifyCredentials takes comparable time for an unknown user as for a known one, preventing enumeration', () => {
  store.addUser({ id: 'alice', password: 'pw1' });

  const timeOf = (fn) => {
    const start = process.hrtime.bigint();
    fn();
    return Number(process.hrtime.bigint() - start);
  };

  const knownUserTime = timeOf(() => session.verifyCredentials('alice', 'pw2'));
  const unknownUserTime = timeOf(() => session.verifyCredentials('nobody', 'pw2'));

  const ratio = Math.max(knownUserTime, unknownUserTime) / Math.min(knownUserTime, unknownUserTime);
  assert.ok(ratio < 3, `expected comparable timing, got ratio ${ratio}`);
});
