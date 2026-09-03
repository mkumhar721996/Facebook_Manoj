const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function isPasswordStrongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export function validateRegistration(body: { email?: unknown; password?: unknown }): ValidationResult {
  const { email, password } = body;

  if (email === undefined || email === null || email === "") {
    return { ok: false, error: "Email is required" };
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Email must be a valid email address" };
  }
  if (password === undefined || password === null || password === "") {
    return { ok: false, error: "Password is required" };
  }
  if (typeof password !== "string" || !isPasswordStrongEnough(password)) {
    return {
      ok: false,
      error: "Password must be at least 8 characters long and include at least one letter and one digit",
    };
  }

  return { ok: true };
}
