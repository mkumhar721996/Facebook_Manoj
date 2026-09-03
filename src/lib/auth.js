const crypto = require('crypto');

// Shared secret used to sign/verify session tokens. In production this is
// injected via the environment by whatever issues sessions (login service);
// falling back to a per-process random value keeps every server instance
// internally consistent without ever hardcoding a secret in source.
const SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');

function sign(userId) {
  const payload = Buffer.from(JSON.stringify({ userId })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verify(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const { userId } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof userId === 'string' && userId ? userId : null;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
