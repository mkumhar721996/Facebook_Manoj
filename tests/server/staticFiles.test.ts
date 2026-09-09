import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../../src/server/app.ts";
import { resolveWithinBase } from "../../src/server/staticFileResolver.ts";
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

// Path traversal hardening: resolveWithinBase must reject any requested path
// that escapes the base directory, independent of upstream URL normalization.
test("resolveWithinBase rejects a relative path that escapes the base directory", () => {
  const baseDir = path.resolve("/workspace/src/shared");

  const result = resolveWithinBase(baseDir, "../../../../etc/passwd");

  assert.equal(result, undefined);
});

test("resolveWithinBase rejects a requested path containing an absolute escape after normalization", () => {
  const baseDir = path.resolve("/workspace/src/web/src");

  const result = resolveWithinBase(baseDir, "../../package.json");

  assert.equal(result, undefined);
});

test("resolveWithinBase accepts a relative path that stays within the base directory", () => {
  const baseDir = path.resolve("/workspace/src/shared");

  const result = resolveWithinBase(baseDir, "validation.js");

  assert.equal(result, path.join(baseDir, "validation.js"));
});

test("resolveWithinBase accepts a requested path with a leading slash as relative to the base directory", () => {
  const baseDir = path.resolve("/workspace/src/shared");

  const result = resolveWithinBase(baseDir, "/validation.js");

  assert.equal(result, path.join(baseDir, "validation.js"));
});

// HTTP-level regression: even a raw request line with literal ".." segments
// (bypassing any client-side URL normalization) must never escape the
// intended static directory.
test("GET /shared/../../../../etc/passwd over a raw socket never returns file contents outside the shared dir", async () => {
  const accountService = new AccountService(new InMemoryAccountRepository(), new FakeEmailSender());
  const sessionStore = new InMemorySessionStore();
  const server = createApp({ accountService, sessionStore });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const response = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(port, "127.0.0.1", () => {
        socket.write("GET /shared/../../../../etc/passwd HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
      });
      let data = "";
      socket.on("data", (chunk) => (data += chunk));
      socket.on("end", () => resolve(data));
      socket.on("error", reject);
    });

    assert.match(response.split("\r\n")[0], /404/);
    assert.doesNotMatch(response, /root:.*:0:0:/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
