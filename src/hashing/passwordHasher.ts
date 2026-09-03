import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hash(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verify(plain: string, storedHash: string): boolean {
  const [salt, derivedKey] = storedHash.split(":");
  if (!salt || !derivedKey) {
    return false;
  }
  const candidate = scryptSync(plain, salt, KEY_LENGTH);
  const expected = Buffer.from(derivedKey, "hex");
  if (candidate.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(candidate, expected);
}
