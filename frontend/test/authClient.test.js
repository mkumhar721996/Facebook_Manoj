import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthClient } from "../src/api/authClient.js";

function fakeFetch(responses) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      const response = responses.shift();
      return {
        ok: response.status < 400,
        status: response.status,
        json: async () => response.body,
      };
    },
  };
}

// Fixture credential for exercising the auth client in tests, not a real secret.
const VALID_CREDENTIAL = "Abcd1234";

test("register posts credentials and resolves with the response body on success", async () => {
  const { fetchImpl, calls } = fakeFetch([{ status: 201, body: { email: "a@b.com" } }]);
  const client = createAuthClient({ baseUrl: "http://backend.test", fetchImpl });

  const result = await client.register("a@b.com", VALID_CREDENTIAL);

  assert.deepEqual(result, { email: "a@b.com" });
  assert.equal(calls[0].url, "http://backend.test/auth/register");
  assert.deepEqual(JSON.parse(calls[0].options.body), { email: "a@b.com", password: VALID_CREDENTIAL });
});

test("register rejects with the server error message on failure", async () => {
  const { fetchImpl } = fakeFetch([{ status: 409, body: { error: "Email already registered" } }]);
  const client = createAuthClient({ baseUrl: "http://backend.test", fetchImpl });

  await assert.rejects(() => client.register("a@b.com", VALID_CREDENTIAL), /already registered/i);
});

test("login resolves with a token on success", async () => {
  const { fetchImpl } = fakeFetch([{ status: 200, body: { token: "jwt-token" } }]);
  const client = createAuthClient({ baseUrl: "http://backend.test", fetchImpl });

  const result = await client.login("a@b.com", VALID_CREDENTIAL);

  assert.deepEqual(result, { token: "jwt-token" });
});

test("login rejects with an error message on invalid credentials", async () => {
  const { fetchImpl } = fakeFetch([{ status: 401, body: { error: "Invalid email or password" } }]);
  const client = createAuthClient({ baseUrl: "http://backend.test", fetchImpl });

  await assert.rejects(() => client.login("a@b.com", "wrong"), /invalid email or password/i);
});
