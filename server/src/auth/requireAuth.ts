import type { IncomingMessage } from 'node:http';
import { verifySessionToken } from './session.ts';

const BEARER_PREFIX = 'Bearer ';

export function getAuthenticatedUserId(req: IncomingMessage): string | null {
  const header = req.headers['authorization'];
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || !value.startsWith(BEARER_PREFIX)) return null;

  const token = value.slice(BEARER_PREFIX.length);
  return verifySessionToken(token);
}
