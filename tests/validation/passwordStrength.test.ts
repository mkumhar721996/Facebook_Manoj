import { test } from "node:test";
import assert from "node:assert/strict";

import { isStrongPassword } from "../../src/validation/passwordStrength.ts";

test("rejects passwords shorter than the minimum length", () => {
  assert.equal(isStrongPassword("Ab1"), false);
});

test("rejects passwords with no letters", () => {
  assert.equal(isStrongPassword("12345678"), false);
});

test("rejects passwords with no digits", () => {
  assert.equal(isStrongPassword("abcdefgh"), false);
});

test("accepts a password meeting the minimum strength requirement", () => {
  assert.equal(isStrongPassword("NewStrongPass1"), true);
});
