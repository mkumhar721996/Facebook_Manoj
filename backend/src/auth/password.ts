import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

// A validly-shaped but non-matching hash, used to force a real scrypt computation
// when no account exists, so login timing doesn't reveal whether an email is registered.
export const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${"0".repeat(KEY_LENGTH * 2)}`;

export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verify(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
}
