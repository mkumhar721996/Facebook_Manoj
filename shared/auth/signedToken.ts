import { createHmac, timingSafeEqual } from "node:crypto";

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSignedToken(value: string, secret: string): string {
  return `${value}.${sign(value, secret)}`;
}

/**
 * Verifies an HMAC-signed `value.signature` token. Returns the value only when
 * the signature matches, so a forged/tampered token can never be trusted as
 * someone else's identity.
 */
export function verifySignedToken(
  token: string | null | undefined,
  secret: string
): string | null {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const value = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expected = sign(value, secret);

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }
  return value;
}
