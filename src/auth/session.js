const crypto = require('crypto');
const store = require('../store');
const { verifyPassword } = require('./password');

const COOKIE_NAME = 'session';
// Signing secret for session tokens. Falls back to a per-process random
// secret so a restart invalidates old sessions rather than trusting a
// predictable default in the absence of a configured one.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function sign(userId) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(userId).digest('hex');
}

function createSessionCookie(userId) {
  const token = `${userId}.${sign(userId)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict`;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) {
    return cookies;
  }
  header.split(';').forEach((pair) => {
    const index = pair.indexOf('=');
    if (index === -1) {
      return;
    }
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function verifySessionToken(token) {
  if (!token) {
    return null;
  }
  const separatorIndex = token.lastIndexOf('.');
  if (separatorIndex === -1) {
    return null;
  }
  const userId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expected = sign(userId);

  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }
  return userId;
}

/**
 * Resolves the logged-in user from a cryptographically signed session
 * cookie (issued only via a successful /login). Unlike a bare client
 * header, this cannot be forged without the server's signing secret.
 */
function resolveUserId(req) {
  const cookies = parseCookies(req);
  const userId = verifySessionToken(cookies[COOKIE_NAME]);
  if (!userId || !store.getUser(userId)) {
    return null;
  }
  return userId;
}

// Dummy salt/hash used when the user doesn't exist, so verifyPassword's
// scryptSync cost is paid on every login attempt and response time can't
// be used to enumerate valid user ids.
const DUMMY_SALT = crypto.randomBytes(16).toString('hex');
const DUMMY_HASH = crypto.randomBytes(64).toString('hex');

function verifyCredentials(userId, password) {
  const user = store.getUser(userId);
  const salt = user?.passwordSalt || DUMMY_SALT;
  const hash = user?.passwordHash || DUMMY_HASH;
  const isPasswordValid = verifyPassword(password, salt, hash);
  return Boolean(user && user.passwordSalt && user.passwordHash && isPasswordValid);
}

module.exports = { createSessionCookie, resolveUserId, verifyCredentials, COOKIE_NAME };
