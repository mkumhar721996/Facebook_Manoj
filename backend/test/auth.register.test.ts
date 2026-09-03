import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createApp } from "../src/app.ts";
import { createDb, type Db } from "../src/db.ts";
import { findByEmail } from "../src/users/repository.ts";

let server: Server;
let db: Db;
let baseUrl: string;

beforeEach(async () => {
  db = createDb();
  server = createServer(createApp(db));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function postJson(path: string, body: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("registers a new user, returning 201 with the created email and hashing the password", async () => {
  const res = await postJson("/auth/register", { email: "a@b.com", password: "Abcd1234" });
  assert.equal(res.status, 201);

  const data = await res.json();
  assert.equal(data.email, "a@b.com");
  assert.equal("password" in data, false);
  assert.equal("passwordHash" in data, false);

  const stored = findByEmail(db, "a@b.com");
  assert.ok(stored);
  assert.notEqual(stored?.passwordHash, "Abcd1234");
});

test("rejects a duplicate email registration and does not create a duplicate account", async () => {
  const first = await postJson("/auth/register", { email: "dup@b.com", password: "Abcd1234" });
  assert.equal(first.status, 201);

  const second = await postJson("/auth/register", { email: "dup@b.com", password: "Different9" });
  assert.equal(second.status, 409);
  const data = await second.json();
  assert.match(data.error, /already registered/i);

  const matches = [...db.users.values()].filter((u) => u.email === "dup@b.com");
  assert.equal(matches.length, 1);
});

test("rejects registration with a missing email", async () => {
  const res = await postJson("/auth/register", { password: "Abcd1234" });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /email/i);
  assert.equal(db.users.size, 0);
});

test("rejects registration with a missing password", async () => {
  const res = await postJson("/auth/register", { email: "a@b.com" });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /password/i);
  assert.equal(db.users.size, 0);
});

test("rejects registration with a password below the minimum strength requirement", async () => {
  const res = await postJson("/auth/register", { email: "a@b.com", password: "short" });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /password/i);
  assert.equal(db.users.size, 0);
});
