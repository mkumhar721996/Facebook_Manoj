const MIN_LENGTH = 8;

export function isStrongPassword(password: string): boolean {
  if (password.length < MIN_LENGTH) {
    return false;
  }
  if (!/[a-zA-Z]/.test(password)) {
    return false;
  }
  if (!/[0-9]/.test(password)) {
    return false;
  }
  return true;
}
