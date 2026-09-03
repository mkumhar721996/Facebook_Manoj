import type { Db } from "../db.ts";
import { create, findByEmail } from "../users/repository.ts";
import { validateRegistration } from "./validation.ts";
import { hash, verify } from "./password.ts";
import { signToken } from "./jwt.ts";

export interface RouteResult {
  status: number;
  body: unknown;
}

interface Credentials {
  email?: unknown;
  password?: unknown;
}

export function handleRegister(db: Db, body: unknown): RouteResult {
  const { email, password } = (body ?? {}) as Credentials;

  const validation = validateRegistration({ email, password });
  if (!validation.ok) {
    return { status: 400, body: { error: validation.error } };
  }

  const normalizedEmail = (email as string).toLowerCase();
  if (findByEmail(db, normalizedEmail)) {
    return { status: 409, body: { error: "Email already registered" } };
  }

  const user = create(db, normalizedEmail, hash(password as string));
  return { status: 201, body: { email: user.email } };
}

const INVALID_CREDENTIALS_ERROR = "Invalid email or password";

export function handleLogin(db: Db, body: unknown): RouteResult {
  const { email, password } = (body ?? {}) as Credentials;

  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return { status: 401, body: { error: INVALID_CREDENTIALS_ERROR } };
  }

  const user = findByEmail(db, email);
  if (!user || !verify(password, user.passwordHash)) {
    return { status: 401, body: { error: INVALID_CREDENTIALS_ERROR } };
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { status: 200, body: { token } };
}
