import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../../src/server/app.ts";
import { InMemoryAccountRepository } from "../../src/server/repositories/accountRepository.ts";
import { FakeEmailSender } from "../../src/server/email/emailSender.ts";
import { AccountService } from "../../src/server/services/accountService.ts";
import { InMemorySessionStore } from "../../src/server/session/sessionStore.ts";

async function withServer(fn: (baseUrl: string) => Promise<void>) {
  const accountService = new AccountService(new InMemoryAccountRepository(), new FakeEmailSender());
  const sessionStore = new InMemorySessionStore();
  const server = createApp({ accountService, sessionStore });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test("GET / serves the sign-up page", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /Create your account/);
  });
});

test("GET /login.html serves the login page", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/login.html`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /Log in/);
  });
});

test("GET /src/signupForm.js serves the client-side sign-up script", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/src/signupForm.js`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /attachSignupForm/);
  });
});

test("GET /shared/validation.js serves the shared validation module used by the browser", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/shared/validation.js`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /validateSignup/);
  });
});

test("GET /design/tokens.css serves the design tokens stylesheet", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/design/tokens.css`);
    assert.equal(res.status, 200);
  });
});
