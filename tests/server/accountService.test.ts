import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryAccountRepository } from "../../src/server/repositories/accountRepository.ts";
import { FakeEmailSender } from "../../src/server/email/emailSender.ts";
import { AccountService } from "../../src/server/services/accountService.ts";

function makeService() {
  const repository = new InMemoryAccountRepository();
  const emailSender = new FakeEmailSender();
  const service = new AccountService(repository, emailSender);
  return { repository, emailSender, service };
}

// AC1
test("createAccount stores a new account with status unverified given a valid email and password", async () => {
  const { repository, service } = makeService();

  const result = await service.createAccount({ email: "new@example.com", password: "test-password1" });

  assert.equal(result.outcome, "created");
  const stored = await repository.findByEmail("new@example.com");
  assert.equal(stored?.status, "unverified");
  assert.ok(stored?.passwordHash, "expected a stored password hash");
  assert.notEqual(stored?.passwordHash, "test-password1");
});

// AC2
test("createAccount dispatches exactly one verification email to the submitted address containing a verification token", async () => {
  const { emailSender, service } = makeService();

  await service.createAccount({ email: "new@example.com", password: "test-password1" });

  assert.equal(emailSender.sent.length, 1);
  assert.equal(emailSender.sent[0].to, "new@example.com");
  assert.ok(emailSender.sent[0].verificationToken.length > 0);
});

// AC3
test("createAccount rejects signup when the email belongs to an already-verified account", async () => {
  const { repository, emailSender, service } = makeService();
  await repository.save({
    id: "existing-1",
    email: "taken@example.com",
    passwordHash: "irrelevant",
    status: "verified",
  });

  const result = await service.createAccount({ email: "taken@example.com", password: "test-password1" });

  assert.equal(result.outcome, "email-taken");
  assert.match(result.message, /log in|password/i);
  assert.equal(emailSender.sent.length, 0);
});

// AC4
test("createAccount resends the verification email and does not create a duplicate account when the email belongs to an existing unverified account", async () => {
  const { repository, emailSender, service } = makeService();
  await repository.save({
    id: "existing-2",
    email: "pending@example.com",
    passwordHash: "irrelevant",
    status: "unverified",
    verificationToken: "old-token",
  });

  const result = await service.createAccount({ email: "pending@example.com", password: "test-password1" });

  assert.equal(result.outcome, "verification-resent");
  assert.equal(emailSender.sent.length, 1);
  assert.equal(emailSender.sent[0].to, "pending@example.com");

  const stored = await repository.findByEmail("pending@example.com");
  assert.equal(stored?.id, "existing-2");
  assert.equal(stored?.status, "unverified");
});

// AC5 (service-level piece: message content)
test("createAccount's verification-resent result tells the user to check their inbox", async () => {
  const { repository, service } = makeService();
  await repository.save({
    id: "existing-3",
    email: "pending2@example.com",
    passwordHash: "irrelevant",
    status: "unverified",
    verificationToken: "old-token",
  });

  const result = await service.createAccount({ email: "pending2@example.com", password: "test-password1" });

  assert.match(result.message, /check your inbox/i);
});

// AC6
test("authenticate rejects login for an unverified account", async () => {
  const { repository, service } = makeService();
  const created = await service.createAccount({ email: "unverified@example.com", password: "test-password1" });
  assert.equal(created.outcome, "created");

  const result = await service.authenticate({ email: "unverified@example.com", password: "test-password1" });

  assert.equal(result.outcome, "denied-unverified");
});

// AC7 (service-level piece: message content)
test("authenticate's denied-unverified result prompts the user to check their inbox", async () => {
  const { service } = makeService();
  await service.createAccount({ email: "unverified2@example.com", password: "test-password1" });

  const result = await service.authenticate({ email: "unverified2@example.com", password: "test-password1" });

  assert.match(result.message, /check your inbox/i);
});

test("authenticate grants access for a verified account with the correct password", async () => {
  const { service } = makeService();
  const created = await service.createAccount({ email: "verifyme@example.com", password: "test-password1" });
  assert.equal(created.outcome, "created");
  await service.verifyAccount(created.verificationToken!);

  const result = await service.authenticate({ email: "verifyme@example.com", password: "test-password1" });

  assert.equal(result.outcome, "authenticated");
});

test("authenticate rejects an incorrect password", async () => {
  const { service } = makeService();
  const created = await service.createAccount({ email: "wrongpass@example.com", password: "test-password1" });
  await service.verifyAccount(created.verificationToken!);

  const result = await service.authenticate({ email: "wrongpass@example.com", password: "wrong-password" });

  assert.equal(result.outcome, "denied-invalid-credentials");
});

// AC10
test("verifyAccount transitions the account status from unverified to verified given a valid token", async () => {
  const { repository, service } = makeService();
  const created = await service.createAccount({ email: "toverify@example.com", password: "test-password1" });

  const result = await service.verifyAccount(created.verificationToken!);

  assert.equal(result.outcome, "verified");
  const stored = await repository.findByEmail("toverify@example.com");
  assert.equal(stored?.status, "verified");
});

test("verifyAccount rejects an unknown or invalid token", async () => {
  const { service } = makeService();

  const result = await service.verifyAccount("not-a-real-token");

  assert.equal(result.outcome, "invalid-token");
});
