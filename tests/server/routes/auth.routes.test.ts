import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../../../src/server/app.ts";
import { InMemoryAccountRepository } from "../../../src/server/repositories/accountRepository.ts";
import { FakeEmailSender } from "../../../src/server/email/emailSender.ts";
import { AccountService } from "../../../src/server/services/accountService.ts";
import { InMemorySessionStore, SESSION_COOKIE_NAME } from "../../../src/server/session/sessionStore.ts";

function makeTestServer() {
  const repository = new InMemoryAccountRepository();
  const emailSender = new FakeEmailSender();
  const accountService = new AccountService(repository, emailSender);
  const sessionStore = new InMemorySessionStore();
  const server = createApp({ accountService, sessionStore });
  return { server, repository, emailSender, accountService, sessionStore };
}

async function withServer(fn: (baseUrl: string, ctx: ReturnType<typeof makeTestServer>) => Promise<void>) {
  const ctx = makeTestServer();
  await new Promise<void>((resolve) => ctx.server.listen(0, resolve));
  const { port } = ctx.server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`, ctx);
  } finally {
    await new Promise<void>((resolve) => ctx.server.close(() => resolve()));
  }
}

function getCookie(res: Response, name: string): string | undefined {
  const raw = res.headers.get("set-cookie");
  if (!raw) return undefined;
  const match = raw.split(";")[0].split("=");
  return match[0] === name ? match[1] : undefined;
}

// AC1 + AC2 (http-level)
test("POST /api/signup with a valid email and password creates an account and dispatches a verification email", async () => {
  await withServer(async (baseUrl, { repository, emailSender }) => {
    const res = await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "new@example.com", password: "test-password1" }),
    });

    assert.equal(res.status, 201);
    const stored = await repository.findByEmail("new@example.com");
    assert.equal(stored?.status, "unverified");
    assert.equal(emailSender.sent.length, 1);
    assert.equal(emailSender.sent[0].to, "new@example.com");
  });
});

// AC3
test("POST /api/signup for an already-verified email responds 409 with a message directing the user to log in or recover their password", async () => {
  await withServer(async (baseUrl, { repository }) => {
    await repository.save({
      id: "existing-1",
      email: "taken@example.com",
      passwordHash: "irrelevant",
      status: "verified",
    });

    const res = await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "taken@example.com", password: "test-password1" }),
    });
    const body = await res.json();

    assert.equal(res.status, 409);
    assert.match(body.message, /log in|password/i);
  });
});

// AC4 + AC5
test("POST /api/signup for an existing-but-unverified email resends the verification email and tells the user to check their inbox", async () => {
  await withServer(async (baseUrl, { repository, emailSender }) => {
    await repository.save({
      id: "existing-2",
      email: "pending@example.com",
      passwordHash: "irrelevant",
      status: "unverified",
      verificationToken: "old-token",
    });

    const res = await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "pending@example.com", password: "test-password1" }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.match(body.message, /check your inbox/i);
    assert.equal(emailSender.sent.length, 1);
  });
});

// AC8 + AC9 (server-side defense-in-depth)
test("POST /api/signup with a malformed email and short password responds 400 with inline field errors and does not create an account", async () => {
  await withServer(async (baseUrl, { repository }) => {
    const res = await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.ok(body.errors.email);
    assert.ok(body.errors.password);
    assert.equal(await repository.findByEmail("not-an-email"), undefined);
  });
});

// AC6 + AC7
test("POST /api/login for an unverified account responds 403, prompts to check inbox, and does not set a session cookie", async () => {
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unverified@example.com", password: "test-password1" }),
    });

    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "unverified@example.com", password: "test-password1" }),
    });
    const body = await res.json();

    assert.equal(res.status, 403);
    assert.match(body.message, /check your inbox/i);
    assert.equal(getCookie(res, SESSION_COOKIE_NAME), undefined);
  });
});

// AC10 + AC11
test("GET /api/verify with a valid token verifies the account, grants a session, and a subsequent authenticated request succeeds", async () => {
  await withServer(async (baseUrl, { emailSender }) => {
    await fetch(`${baseUrl}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "verifyme@example.com", password: "test-password1" }),
    });
    const token = emailSender.sent[0].verificationToken;

    const verifyRes = await fetch(`${baseUrl}/api/verify?token=${token}`, { redirect: "manual" });
    const sessionCookie = getCookie(verifyRes, SESSION_COOKIE_NAME);

    assert.equal(verifyRes.status, 200);
    assert.ok(sessionCookie, "expected a session cookie to be set on verification");

    const meRes = await fetch(`${baseUrl}/api/me`, {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
    });

    assert.equal(meRes.status, 200);
  });
});

test("GET /api/verify with an invalid token responds 400 and does not grant access", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/verify?token=does-not-exist`, { redirect: "manual" });

    assert.equal(res.status, 400);
    assert.equal(getCookie(res, SESSION_COOKIE_NAME), undefined);
  });
});

test("GET /api/me without a session cookie responds 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/me`);
    assert.equal(res.status, 401);
  });
});
