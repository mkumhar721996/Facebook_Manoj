import test from "node:test";
import assert from "node:assert/strict";
import { validateSignup } from "../../src/shared/validation.js";

test("validateSignup returns no errors for a valid email and password", () => {
  const result = validateSignup({ email: "user@example.com", password: "goodpass1" });
  assert.deepEqual(result.errors, {});
  assert.equal(result.valid, true);
});

test("validateSignup returns a field error for a missing email", () => {
  const result = validateSignup({ email: "", password: "goodpass1" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.email, "expected an email error");
});

test("validateSignup returns a field error for a malformed email", () => {
  const result = validateSignup({ email: "not-an-email", password: "goodpass1" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.email, "expected an email error");
});

test("validateSignup returns a field error for a password below the minimum requirement", () => {
  const result = validateSignup({ email: "user@example.com", password: "short1" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.password, "expected a password error");
});

test("validateSignup returns a field error for a password missing a number", () => {
  const result = validateSignup({ email: "user@example.com", password: "onlyletters" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.password, "expected a password error");
});

test("validateSignup returns a field error for a missing password", () => {
  const result = validateSignup({ email: "user@example.com", password: "" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.password, "expected a password error");
});
