import { test } from "node:test";
import assert from "node:assert/strict";
import { createLoginController } from "../src/controllers/loginController.js";
import { createAuthStore, createMemoryStorage } from "../src/state/authStore.js";

function makeController({ loginImpl } = {}) {
  const navigateCalls = [];
  const loginCalls = [];
  const authClient = {
    login(email, password) {
      loginCalls.push([email, password]);
      return loginImpl ? loginImpl(email, password) : Promise.resolve({ token: "jwt-token" });
    },
  };
  const authStore = createAuthStore({ storage: createMemoryStorage() });
  const navigate = (path) => navigateCalls.push(path);
  const controller = createLoginController({ authClient, authStore, navigate });
  return { controller, authStore, navigateCalls, loginCalls };
}

test("correct credentials return a token, store the session, and redirect to the task list", async () => {
  const { controller, authStore, navigateCalls, loginCalls } = makeController();

  const result = await controller.submit("user@example.com", "Abcd1234");

  assert.equal(result.success, true);
  assert.deepEqual(loginCalls, [["user@example.com", "Abcd1234"]]);
  assert.equal(authStore.getToken(), "jwt-token");
  assert.deepEqual(navigateCalls, ["/tasks"]);
});

test("incorrect credentials show an error and create no session", async () => {
  const { controller, authStore, navigateCalls } = makeController({
    loginImpl: () => Promise.reject(new Error("Invalid email or password")),
  });

  const result = await controller.submit("user@example.com", "WrongPass1");

  assert.equal(result.success, false);
  assert.match(result.error, /invalid email or password/i);
  assert.equal(authStore.getToken(), null);
  assert.deepEqual(navigateCalls, []);
});
