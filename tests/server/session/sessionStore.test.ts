import test from "node:test";
import assert from "node:assert/strict";
import { InMemorySessionStore } from "../../../src/server/session/sessionStore.ts";

test("create returns a session id that resolves back to the account id", () => {
  const store = new InMemorySessionStore();

  const sessionId = store.create("account-1");
  const accountId = store.getAccountId(sessionId);

  assert.equal(accountId, "account-1");
});

test("getAccountId returns undefined for an unknown session id", () => {
  const store = new InMemorySessionStore();

  const accountId = store.getAccountId("unknown-session");

  assert.equal(accountId, undefined);
});

test("create issues a different session id on each call", () => {
  const store = new InMemorySessionStore();

  const first = store.create("account-1");
  const second = store.create("account-1");

  assert.notEqual(first, second);
});

test("destroy removes the session so it no longer resolves", () => {
  const store = new InMemorySessionStore();
  const sessionId = store.create("account-1");

  store.destroy(sessionId);

  assert.equal(store.getAccountId(sessionId), undefined);
});
