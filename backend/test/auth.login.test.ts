import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createApp } from "../src/app.ts";
import { createDb, type Db } from "../src/db.ts";
import { create } from "../src/users/repository.ts";
import { hash } from "../src/auth/password.ts";
import { verifyToken } from "../src/auth/jwt.ts";

let server: Server;
let db: Db;
let baseUrl: string;

beforeEach(async () => {
  db = createDb();
  create(db, "user@example.com", hash("Abcd1234"));
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

test("logs in with correct credentials, returning a verifiable JWT", async () => {
  const res = await postJson("/auth/login", { email: "user@example.com", password: "Abcd1234" });
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(typeof data.token, "string");

  const payload = verifyToken(data.token);
  assert.ok(payload);
  assert.equal(payload?.email, "user@example.com");
});

test("rejects login with an unknown email, without issuing a token", async () => {
  const res = await postJson("/auth/login", { email: "nobody@example.com", password: "Abcd1234" });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.match(data.error, /invalid email or password/i);
  assert.equal("token" in data, false);
});

test("rejects login with an incorrect password, without issuing a token", async () => {
  const res = await postJson("/auth/login", { email: "user@example.com", password: "WrongPass1" });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.match(data.error, /invalid email or password/i);
  assert.equal("token" in data, false);
});
