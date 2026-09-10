import { verifyToken, type JwtPayload } from "./jwt.ts";

export interface AuthResult {
  authorized: boolean;
  user?: JwtPayload;
}

const BEARER_PREFIX = "Bearer ";

export function requireAuth(authHeader: string | undefined): AuthResult {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return { authorized: false };
  }
  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return { authorized: false };
  }
  return { authorized: true, user: payload };
}
