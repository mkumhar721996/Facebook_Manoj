import { test } from "node:test";
import assert from "node:assert/strict";

import { InMemoryUserRepository } from "../../src/repositories/userRepository.ts";
import { InMemoryPasswordResetTokenRepository } from "../../src/repositories/passwordResetTokenRepository.ts";
import { FakeEmailSender } from "../../src/email/emailSender.ts";
import { PasswordResetService } from "../../src/services/passwordResetService.ts";
import * as passwordHasher from "../../src/hashing/passwordHasher.ts";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const APP_BASE_URL = "http://localhost:3000";

function buildService() {
  const userRepository = new InMemoryUserRepository([
    { id: "user-1", email: "registered@example.com", passwordHash: passwordHasher.hash("OldPassw0rd") },
  ]);
  const tokenRepository = new InMemoryPasswordResetTokenRepository();
  const emailSender = new FakeEmailSender();
  const service = new PasswordResetService({
    userRepository,
    tokenRepository,
    emailSender,
    passwordHasher,
    ttlMs: RESET_TOKEN_TTL_MS,
    baseUrl: APP_BASE_URL,
  });
  return { userRepository, tokenRepository, emailSender, service };
}

test("requestReset sends a password reset email with a unique link for a registered email", async () => {
  const { tokenRepository, emailSender, service } = buildService();
  const before = Date.now();

  await service.requestReset("registered@example.com");

  assert.equal(emailSender.sentEmails.length, 1);
  const sent = emailSender.sentEmails[0];
  assert.equal(sent.to, "registered@example.com");

  const match = sent.resetLink.match(/token=([a-f0-9]{64})/);
  assert.ok(match, `expected reset link to contain a 64-char hex token, got: ${sent.resetLink}`);
  const token = match![1];

  const record = tokenRepository.findByToken(token);
  assert.ok(record, "expected token to be persisted");
  assert.equal(record!.userId, "user-1");
  assert.equal(record!.usedAt, null);
  assert.ok(record!.expiresAt >= before + RESET_TOKEN_TTL_MS - 1000);
  assert.ok(record!.expiresAt <= before + RESET_TOKEN_TTL_MS + 5000);
});

test("requestReset returns the same result and sends no email for an unregistered email", async () => {
  const { emailSender, service } = buildService();

  const result = await service.requestReset("unregistered@example.com");

  assert.deepEqual(result, { status: "ok" });
  assert.equal(emailSender.sentEmails.length, 0);
});

test("confirmReset updates the password and redirects to login for a valid token and strong password", async () => {
  const { userRepository, tokenRepository, service } = buildService();
  const token = "a".repeat(64);
  tokenRepository.create("user-1", token, Date.now() + RESET_TOKEN_TTL_MS);

  const result = await service.confirmReset(token, "NewStrongPass1");

  assert.deepEqual(result, { status: "ok", redirectTo: "/login" });

  const user = userRepository.findByEmail("registered@example.com")!;
  assert.equal(passwordHasher.verify("NewStrongPass1", user.passwordHash), true);

  const record = tokenRepository.findByToken(token)!;
  assert.ok(record.usedAt !== null, "expected token to be marked used");
});

test("confirmReset rejects an expired token and leaves the password unchanged", async () => {
  const { userRepository, tokenRepository, service } = buildService();
  const originalHash = userRepository.findByEmail("registered@example.com")!.passwordHash;
  const token = "c".repeat(64);
  tokenRepository.create("user-1", token, Date.now() - 1000);

  const result = await service.confirmReset(token, "NewStrongPass1");

  assert.deepEqual(result, { status: "error", reason: "invalid_or_expired_token" });
  assert.equal(userRepository.findByEmail("registered@example.com")!.passwordHash, originalHash);
});

test("confirmReset rejects a weak password, leaves the password unchanged, and keeps the token usable", async () => {
  const { userRepository, tokenRepository, service } = buildService();
  const originalHash = userRepository.findByEmail("registered@example.com")!.passwordHash;
  const token = "f".repeat(64);
  tokenRepository.create("user-1", token, Date.now() + RESET_TOKEN_TTL_MS);

  const result = await service.confirmReset(token, "weak");

  assert.deepEqual(result, { status: "error", reason: "weak_password" });
  assert.equal(userRepository.findByEmail("registered@example.com")!.passwordHash, originalHash);

  const record = tokenRepository.findByToken(token)!;
  assert.equal(record.usedAt, null);
});

test("confirmReset rejects an already-used token and leaves the password unchanged", async () => {
  const { userRepository, tokenRepository, service } = buildService();
  const originalHash = userRepository.findByEmail("registered@example.com")!.passwordHash;
  const token = "d".repeat(64);
  tokenRepository.create("user-1", token, Date.now() + RESET_TOKEN_TTL_MS);
  tokenRepository.markUsed(token);

  const result = await service.confirmReset(token, "NewStrongPass1");

  assert.deepEqual(result, { status: "error", reason: "invalid_or_expired_token" });
  assert.equal(userRepository.findByEmail("registered@example.com")!.passwordHash, originalHash);
});
