const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createNotificationPreferenceStore,
} = require("../services/notificationPreferenceStore");
const { createApp } = require("../app");

async function withServer(t, store) {
  const server = createApp({ preferenceStore: store }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  t.after(() => server.close());
  return `http://127.0.0.1:${port}`;
}

test("GET returns the default 'push' preference when none has been saved (AC3)", async (t) => {
  const store = createNotificationPreferenceStore();
  const baseUrl = await withServer(t, store);

  const response = await fetch(
    `${baseUrl}/api/customers/customer-1/notification-preference`,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { channel: "push" });
});

test("PUT saves a customer's chosen channel (AC1/AC2)", async (t) => {
  const store = createNotificationPreferenceStore();
  const baseUrl = await withServer(t, store);

  const putResponse = await fetch(
    `${baseUrl}/api/customers/customer-1/notification-preference`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "sms" }),
    },
  );

  assert.equal(putResponse.status, 200);
  assert.equal(store.getPreference("customer-1"), "sms");
});

test("PUT overwrites a previously saved channel (AC6)", async (t) => {
  const store = createNotificationPreferenceStore();
  const baseUrl = await withServer(t, store);
  store.setPreference("customer-1", "sms");

  await fetch(`${baseUrl}/api/customers/customer-1/notification-preference`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "push" }),
  });

  assert.equal(store.getPreference("customer-1"), "push");
});

test("PUT accepts 'both' as a channel (AC5)", async (t) => {
  const store = createNotificationPreferenceStore();
  const baseUrl = await withServer(t, store);

  const response = await fetch(
    `${baseUrl}/api/customers/customer-1/notification-preference`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "both" }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { channel: "both" });
});

test("PUT rejects an invalid channel with 400", async (t) => {
  const store = createNotificationPreferenceStore();
  const baseUrl = await withServer(t, store);

  const response = await fetch(
    `${baseUrl}/api/customers/customer-1/notification-preference`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "carrier-pigeon" }),
    },
  );

  assert.equal(response.status, 400);
  assert.equal(store.getPreference("customer-1"), "push");
});
