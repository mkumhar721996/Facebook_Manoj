import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { InMemoryUserRepository } from "../../src/repositories/userRepository.ts";
import { InMemoryPasswordResetTokenRepository } from "../../src/repositories/passwordResetTokenRepository.ts";
import { FakeEmailSender } from "../../src/email/emailSender.ts";
import { PasswordResetService } from "../../src/services/passwordResetService.ts";
import * as passwordHasher from "../../src/hashing/passwordHasher.ts";
import { createApp } from "../../src/http/app.ts";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const APP_BASE_URL = "http://localhost:3000";

async function startServer() {
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
  const app = createApp(service);
  await new Promise<void>((resolve) => app.listen(0, resolve));
  const { port } = app.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  return { app, baseUrl, userRepository, tokenRepository, emailSender };
}

async function stopServer(app: { close: (cb: () => void) => void }) {
  await new Promise<void>((resolve) => app.close(resolve));
}

test("POST /password-reset/request returns identical responses for registered and unregistered emails", async () => {
  const { app, baseUrl } = await startServer();
  try {
    const registeredResponse = await fetch(`${baseUrl}/password-reset/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "registered@example.com" }),
    });
    const unregisteredResponse = await fetch(`${baseUrl}/password-reset/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unregistered@example.com" }),
    });

    assert.equal(registeredResponse.status, unregisteredResponse.status);
    const registeredBody = await registeredResponse.json();
    const unregisteredBody = await unregisteredResponse.json();
    assert.deepEqual(registeredBody, unregisteredBody);
  } finally {
    await stopServer(app);
  }
});

test("POST /password-reset/confirm with a valid token and strong password redirects to /login", async () => {
  const { app, baseUrl, tokenRepository } = await startServer();
  const token = "b".repeat(64);
  tokenRepository.create("user-1", token, Date.now() + RESET_TOKEN_TTL_MS);

  try {
    const response = await fetch(`${baseUrl}/password-reset/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: "NewStrongPass1" }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, { redirectTo: "/login" });
  } finally {
    await stopServer(app);
  }
});

test("POST /password-reset/confirm with an expired token returns an error and does not change the password", async () => {
  const { app, baseUrl, tokenRepository, userRepository } = await startServer();
  const originalHash = userRepository.findByEmail("registered@example.com")!.passwordHash;
  const token = "e".repeat(64);
  tokenRepository.create("user-1", token, Date.now() - 1000);

  try {
    const response = await fetch(`${baseUrl}/password-reset/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: "NewStrongPass1" }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(typeof body.message === "string" && body.message.length > 0);
    assert.equal(userRepository.findByEmail("registered@example.com")!.passwordHash, originalHash);
  } finally {
    await stopServer(app);
  }
});

test("POST /password-reset/confirm with a weak password returns an error and does not change the password", async () => {
  const { app, baseUrl, tokenRepository, userRepository } = await startServer();
  const originalHash = userRepository.findByEmail("registered@example.com")!.passwordHash;
  const token = "g".repeat(64);
  tokenRepository.create("user-1", token, Date.now() + RESET_TOKEN_TTL_MS);

  try {
    const response = await fetch(`${baseUrl}/password-reset/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: "weak" }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(typeof body.message === "string" && body.message.length > 0);
    assert.equal(userRepository.findByEmail("registered@example.com")!.passwordHash, originalHash);
  } finally {
    await stopServer(app);
  }
});
