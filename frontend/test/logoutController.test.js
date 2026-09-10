import { test } from "node:test";
import assert from "node:assert/strict";
import { logout } from "../src/controllers/logoutController.js";
import { createAuthStore, createMemoryStorage } from "../src/state/authStore.js";

test("logging out clears the session and returns to the login screen", () => {
  const storage = createMemoryStorage();
  const authStore = createAuthStore({ storage });
  authStore.login("jwt-token");

  const navigateCalls = [];
  logout({ authStore, navigate: (path) => navigateCalls.push(path) });

  assert.equal(authStore.isAuthenticated(), false);
  assert.equal(authStore.getToken(), null);
  assert.equal(storage.getItem("auth_token"), null);
  assert.deepEqual(navigateCalls, ["/login"]);
});
