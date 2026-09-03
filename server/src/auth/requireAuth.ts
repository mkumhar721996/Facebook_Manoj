import type { IncomingMessage } from 'node:http';

export function getAuthenticatedUserId(req: IncomingMessage): string | null {
  const header = req.headers['x-user-id'];
  if (!header) return null;
  return Array.isArray(header) ? header[0] : header;
}
