import { test } from "node:test";
import assert from "node:assert/strict";
import { createRegisterController } from "../src/controllers/registerController.js";
import { createAuthStore, createMemoryStorage } from "../src/state/authStore.js";

function makeController({ registerImpl } = {}) {
  const navigateCalls = [];
  const registerCalls = [];
  const authClient = {
    register(email, password) {
      registerCalls.push([email, password]);
      return registerImpl ? registerImpl(email, password) : Promise.resolve({ email, token: "jwt-token" });
    },
  };
  const authStore = createAuthStore({ storage: createMemoryStorage() });
  const navigate = (path) => navigateCalls.push(path);
  const controller = createRegisterController({ authClient, authStore, navigate });
  return { controller, authStore, navigateCalls, registerCalls };
}

test("valid registration creates the account, logs the user in, and redirects to the task list", async () => {
  const { controller, authStore, navigateCalls, registerCalls } = makeController();

  const result = await controller.submit("a@b.com", "Abcd1234");

  assert.equal(result.success, true);
  assert.deepEqual(registerCalls, [["a@b.com", "Abcd1234"]]);
  assert.equal(authStore.getToken(), "jwt-token");
  assert.deepEqual(navigateCalls, ["/tasks"]);
});

test("duplicate email registration shows an error and does not redirect", async () => {
  const { controller, navigateCalls } = makeController({
    registerImpl: () => Promise.reject(new Error("Email already registered")),
  });

  const result = await controller.submit("dup@b.com", "Abcd1234");

  assert.equal(result.success, false);
  assert.match(result.error, /already registered/i);
  assert.deepEqual(navigateCalls, []);
});

test("missing email is rejected client-side without calling the API", async () => {
  const { controller, registerCalls, navigateCalls } = makeController();

  const result = await controller.submit("", "Abcd1234");

  assert.equal(result.success, false);
  assert.match(result.error, /email/i);
  assert.deepEqual(registerCalls, []);
  assert.deepEqual(navigateCalls, []);
});

test("missing password is rejected client-side without calling the API", async () => {
  const { controller, registerCalls, navigateCalls } = makeController();

  const result = await controller.submit("a@b.com", "");

  assert.equal(result.success, false);
  assert.match(result.error, /password/i);
  assert.deepEqual(registerCalls, []);
  assert.deepEqual(navigateCalls, []);
});

test("weak password is rejected client-side without calling the API", async () => {
  const { controller, registerCalls, navigateCalls } = makeController();

  const result = await controller.submit("a@b.com", "abc");

  assert.equal(result.success, false);
  assert.equal(result.error, "Password must be at least 8 characters and include at least one letter and one digit");
  assert.deepEqual(registerCalls, []);
  assert.deepEqual(navigateCalls, []);
});
