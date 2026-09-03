import { createHmac, timingSafeEqual } from 'node:crypto';

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET environment variable must be set (a randomly generated one would ' +
        'invalidate all sessions on every server restart)',
    );
  }
  return secret;
}

const SECRET = requireSessionSecret();

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(userId, 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return Buffer.from(payload, 'base64url').toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url');
}
