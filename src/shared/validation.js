/**
 * @typedef {{ email: string, password: string }} SignupInput
 * @typedef {{ email?: string, password?: string }} SignupValidationErrors
 * @typedef {{ valid: boolean, errors: SignupValidationErrors }} SignupValidationResult
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

/**
 * @param {string} email
 * @returns {string | undefined}
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

/**
 * @param {string} password
 * @returns {string | undefined}
 */
export function validatePassword(password) {
  if (!password || password.length === 0) {
    return "Password is required.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return undefined;
}

/**
 * @param {SignupInput} input
 * @returns {SignupValidationResult}
 */
export function validateSignup(input) {
  /** @type {SignupValidationErrors} */
  const errors = {};

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  return { valid: Object.keys(errors).length === 0, errors };
}
