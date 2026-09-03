import { test } from "node:test";
import assert from "node:assert/strict";
import { createRegisterController } from "../src/controllers/registerController.js";

function makeController({ registerImpl } = {}) {
  const navigateCalls = [];
  const registerCalls = [];
  const authClient = {
    register(email, password) {
      registerCalls.push([email, password]);
      return registerImpl ? registerImpl(email, password) : Promise.resolve({ email });
    },
  };
  const navigate = (path) => navigateCalls.push(path);
  const controller = createRegisterController({ authClient, navigate });
  return { controller, navigateCalls, registerCalls };
}

test("valid registration creates the account and redirects to the task list", async () => {
  const { controller, navigateCalls, registerCalls } = makeController();

  const result = await controller.submit("a@b.com", "Abcd1234");

  assert.equal(result.success, true);
  assert.deepEqual(registerCalls, [["a@b.com", "Abcd1234"]]);
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
  assert.match(result.error, /password/i);
  assert.deepEqual(registerCalls, []);
  assert.deepEqual(navigateCalls, []);
});
