import type { IncomingMessage } from "node:http";
import { verifySignedToken } from "../../../shared/auth/signedToken.ts";

/**
 * Authenticates the caller from an HMAC-signed `x-user-token` header instead
 * of trusting a plain `x-user-id` header (see security review: API
 * authentication bypass / IDOR — any caller could impersonate any user by
 * setting that header directly). Only the web tier, which holds
 * `internalApiSecret`, can produce a token that verifies here.
 */
export function requireAuth(req: IncomingMessage, internalApiSecret: string): string | null {
  const token = req.headers["x-user-token"];
  if (typeof token !== "string") {
    return null;
  }
  return verifySignedToken(token, internalApiSecret);
}
