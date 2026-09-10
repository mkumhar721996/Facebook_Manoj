import { test } from "node:test";
import assert from "node:assert/strict";
import { guardTasksRoute } from "../src/routes/protectedRoute.js";
import { createAuthStore, createMemoryStorage } from "../src/state/authStore.js";

test("denies access to the protected route when logged out and redirects to login", () => {
  const authStore = createAuthStore({ storage: createMemoryStorage() });
  const navigateCalls = [];

  const allowed = guardTasksRoute({ authStore, navigate: (path) => navigateCalls.push(path) });

  assert.equal(allowed, false);
  assert.deepEqual(navigateCalls, ["/login"]);
});

test("allows access to the protected route when logged in", () => {
  const authStore = createAuthStore({ storage: createMemoryStorage() });
  authStore.login("jwt-token");
  const navigateCalls = [];

  const allowed = guardTasksRoute({ authStore, navigate: (path) => navigateCalls.push(path) });

  assert.equal(allowed, true);
  assert.deepEqual(navigateCalls, []);
});

test("denies access after a logged-in user logs out", () => {
  const authStore = createAuthStore({ storage: createMemoryStorage() });
  authStore.login("jwt-token");
  authStore.logout();
  const navigateCalls = [];

  const allowed = guardTasksRoute({ authStore, navigate: (path) => navigateCalls.push(path) });

  assert.equal(allowed, false);
  assert.deepEqual(navigateCalls, ["/login"]);
});
