import { parseCookies } from "./cookies.ts";
import { createSignedToken, verifySignedToken } from "../../shared/auth/signedToken.ts";

const SESSION_COOKIE_NAME = "session";

export function createSessionCookie(userId: string, secret: string): string {
  return `${SESSION_COOKIE_NAME}=${createSignedToken(userId, secret)}`;
}

/**
 * Extracts and authenticates the userId from the session cookie. Returns null
 * unless the signature matches, so a forged/tampered cookie can never be
 * trusted as another user's identity (see security review: IDOR via a plain,
 * unsigned userId cookie).
 */
export function verifySession(cookieHeader: string | undefined, secret: string): string | null {
  const value = parseCookies(cookieHeader)[SESSION_COOKIE_NAME];
  return verifySignedToken(value, secret);
}
