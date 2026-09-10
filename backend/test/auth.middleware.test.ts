import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createApp } from "../src/app.ts";
import { createDb, type Db } from "../src/db.ts";
import { signToken } from "../src/auth/jwt.ts";

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

test("denies access to a protected route with no Authorization header", async () => {
  const res = await fetch(`${baseUrl}/tasks`);
  assert.equal(res.status, 401);
});

test("denies access to a protected route with an invalid token", async () => {
  const res = await fetch(`${baseUrl}/tasks`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  assert.equal(res.status, 401);
});

test("allows access to a protected route with a valid token", async () => {
  const token = signToken({ sub: 1, email: "user@example.com" });
  const res = await fetch(`${baseUrl}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data.tasks, []);
});
