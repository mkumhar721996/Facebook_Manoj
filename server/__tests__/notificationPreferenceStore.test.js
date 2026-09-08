const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createNotificationPreferenceStore,
} = require("../services/notificationPreferenceStore");

test("getPreference defaults to 'push' when no preference has been saved (AC3)", () => {
  const store = createNotificationPreferenceStore();

  assert.equal(store.getPreference("customer-1"), "push");
});

test("setPreference persists the chosen channel so it is returned on subsequent reads (AC1/AC2)", () => {
  const store = createNotificationPreferenceStore();

  store.setPreference("customer-1", "sms");

  assert.equal(store.getPreference("customer-1"), "sms");
});

test("setPreference overwrites (not appends to) a prior selection (AC6)", () => {
  const store = createNotificationPreferenceStore();

  store.setPreference("customer-1", "sms");
  store.setPreference("customer-1", "push");

  assert.equal(store.getPreference("customer-1"), "push");
});

test("setPreference accepts 'both' as a valid channel (AC5)", () => {
  const store = createNotificationPreferenceStore();

  store.setPreference("customer-1", "both");

  assert.equal(store.getPreference("customer-1"), "both");
});

test("setPreference rejects an unrecognised channel", () => {
  const store = createNotificationPreferenceStore();

  assert.throws(() => store.setPreference("customer-1", "carrier-pigeon"));
});

test("preferences are tracked independently per customer", () => {
  const store = createNotificationPreferenceStore();

  store.setPreference("customer-1", "sms");

  assert.equal(store.getPreference("customer-2"), "push");
});
