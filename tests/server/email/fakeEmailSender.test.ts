import test from "node:test";
import assert from "node:assert/strict";
import { FakeEmailSender } from "../../../src/server/email/emailSender.ts";

test("FakeEmailSender records sent verification emails", async () => {
  const sender = new FakeEmailSender();

  await sender.sendVerificationEmail("user@example.com", "token-abc");

  assert.equal(sender.sent.length, 1);
  assert.equal(sender.sent[0].to, "user@example.com");
  assert.match(sender.sent[0].verificationToken, /token-abc/);
});

test("FakeEmailSender records multiple sends independently", async () => {
  const sender = new FakeEmailSender();

  await sender.sendVerificationEmail("first@example.com", "token-1");
  await sender.sendVerificationEmail("second@example.com", "token-2");

  assert.equal(sender.sent.length, 2);
  assert.equal(sender.sent[1].to, "second@example.com");
});
