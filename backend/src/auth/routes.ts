import type { Db } from "../db.ts";
import type { UserRecord } from "../db.ts";
import { create, findByEmail } from "../users/repository.ts";
import { validateRegistration } from "./validation.ts";
import { hash, verify, DUMMY_PASSWORD_HASH } from "./password.ts";
import { signToken } from "./jwt.ts";

export interface RouteResult {
  status: number;
  body: unknown;
}

interface Credentials {
  email?: unknown;
  password?: unknown;
}

export async function handleRegister(db: Db, body: unknown): Promise<RouteResult> {
  const { email, password } = (body ?? {}) as Credentials;

  const validation = validateRegistration({ email, password });
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const normalizedEmail = (email as string).toLowerCase();
  // Hash unconditionally, before the duplicate-email check, so registering an
  // existing email takes the same time as registering a new one (mirrors the
  // resolvePasswordHash approach in handleLogin below).
  const passwordHash = await hash(password as string);
  if (findByEmail(db, normalizedEmail)) {
    return { status: 409, body: { error: "Email already registered" } };
  }

  const user = create(db, normalizedEmail, passwordHash);
  const token = signToken({ sub: user.id, email: user.email });
  return { status: 201, body: { email: user.email, token } };
}

const INVALID_CREDENTIALS_ERROR = "Invalid email or password";

export function resolvePasswordHash(user: UserRecord | undefined): string {
  return user ? user.passwordHash : DUMMY_PASSWORD_HASH;
}

export async function handleLogin(db: Db, body: unknown): Promise<RouteResult> {
  const { email, password } = (body ?? {}) as Credentials;

  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return { status: 401, body: { error: INVALID_CREDENTIALS_ERROR } };
  }

  const user = findByEmail(db, email);
  const passwordOk = await verify(password, resolvePasswordHash(user));
  if (!user || !passwordOk) {
    return { status: 401, body: { error: INVALID_CREDENTIALS_ERROR } };
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { status: 200, body: { token } };
}
