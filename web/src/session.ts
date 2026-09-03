import { createHmac, timingSafeEqual } from "node:crypto";
import { parseCookies } from "./cookies.ts";

const SESSION_COOKIE_NAME = "session";

function sign(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function createSessionCookie(userId: string, secret: string): string {
  return `${SESSION_COOKIE_NAME}=${userId}.${sign(userId, secret)}`;
}

/**
 * Extracts and authenticates the userId from the session cookie. Returns null
 * unless the signature matches, so a forged/tampered cookie can never be
 * trusted as another user's identity (see security review: IDOR via a plain,
 * unsigned userId cookie).
 */
export function verifySession(cookieHeader: string | undefined, secret: string): string | null {
  const value = parseCookies(cookieHeader)[SESSION_COOKIE_NAME];
  if (!value) return null;

  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const userId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expected = sign(userId, secret);

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }
  return userId;
}
