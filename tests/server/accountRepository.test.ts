import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryAccountRepository } from "../../src/server/repositories/accountRepository.ts";

test("save then findByEmail returns the stored account", async () => {
  const repo = new InMemoryAccountRepository();
  const account = {
    id: "1",
    email: "user@example.com",
    passwordHash: "hashed",
    status: "unverified" as const,
    verificationToken: "token-123",
  };

  await repo.save(account);
  const found = await repo.findByEmail("user@example.com");

  assert.deepEqual(found, account);
});

test("findByEmail is case-insensitive", async () => {
  const repo = new InMemoryAccountRepository();
  const account = {
    id: "1",
    email: "user@example.com",
    passwordHash: "hashed",
    status: "unverified" as const,
    verificationToken: "token-123",
  };

  await repo.save(account);
  const found = await repo.findByEmail("USER@EXAMPLE.COM");

  assert.deepEqual(found, account);
});

test("findByEmail returns undefined for an unknown email", async () => {
  const repo = new InMemoryAccountRepository();
  const found = await repo.findByEmail("missing@example.com");
  assert.equal(found, undefined);
});

test("findByVerificationToken returns the matching account", async () => {
  const repo = new InMemoryAccountRepository();
  const account = {
    id: "1",
    email: "user@example.com",
    passwordHash: "hashed",
    status: "unverified" as const,
    verificationToken: "token-123",
  };

  await repo.save(account);
  const found = await repo.findByVerificationToken("token-123");

  assert.deepEqual(found, account);
});

test("save can update an existing account in place", async () => {
  const repo = new InMemoryAccountRepository();
  const account = {
    id: "1",
    email: "user@example.com",
    passwordHash: "hashed",
    status: "unverified" as const,
    verificationToken: "token-123",
  };
  await repo.save(account);

  await repo.save({ ...account, status: "verified", verificationToken: undefined });
  const found = await repo.findByEmail("user@example.com");

  assert.equal(found?.status, "verified");
  assert.equal(found?.verificationToken, undefined);
});
