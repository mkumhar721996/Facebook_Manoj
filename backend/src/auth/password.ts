import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

// A validly-shaped but non-matching hash, used to force a real scrypt computation
// when no account exists, so login timing doesn't reveal whether an email is registered.
export const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${"0".repeat(KEY_LENGTH * 2)}`;

export function hash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verify(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
}
