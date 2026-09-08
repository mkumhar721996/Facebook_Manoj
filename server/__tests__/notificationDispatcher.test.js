const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createNotificationPreferenceStore,
} = require("../services/notificationPreferenceStore");
const {
  createNotificationDispatcher,
} = require("../services/notificationDispatcher");

function makeFakeSender() {
  const calls = [];
  return {
    send: (customerId, event) => {
      calls.push({ customerId, event });
    },
    calls,
  };
}

function setUp() {
  const store = createNotificationPreferenceStore();
  const pushSender = makeFakeSender();
  const smsSender = makeFakeSender();
  const dispatcher = createNotificationDispatcher({
    preferenceStore: store,
    pushSender,
    smsSender,
  });
  return { store, pushSender, smsSender, dispatcher };
}

test("defaults to push when no preference has been saved (AC3)", () => {
  const { pushSender, smsSender, dispatcher } = setUp();
  const event = { orderId: "order-1", status: "shipped" };

  dispatcher.dispatchOrderStatusNotification("customer-1", event);

  assert.equal(pushSender.calls.length, 1);
  assert.deepEqual(pushSender.calls[0], { customerId: "customer-1", event });
  assert.equal(smsSender.calls.length, 0);
});

test("delivers via sms only when sms is the saved preference (AC2)", () => {
  const { store, pushSender, smsSender, dispatcher } = setUp();
  const event = { orderId: "order-1", status: "shipped" };
  store.setPreference("customer-1", "sms");

  dispatcher.dispatchOrderStatusNotification("customer-1", event);

  assert.equal(smsSender.calls.length, 1);
  assert.deepEqual(smsSender.calls[0], { customerId: "customer-1", event });
  assert.equal(pushSender.calls.length, 0);
});

test("delivers via both push and sms when 'both' is the saved preference (AC5)", () => {
  const { store, pushSender, smsSender, dispatcher } = setUp();
  const event = { orderId: "order-1", status: "delivered" };
  store.setPreference("customer-1", "both");

  dispatcher.dispatchOrderStatusNotification("customer-1", event);

  assert.equal(pushSender.calls.length, 1);
  assert.equal(smsSender.calls.length, 1);
  assert.deepEqual(pushSender.calls[0], { customerId: "customer-1", event });
  assert.deepEqual(smsSender.calls[0], { customerId: "customer-1", event });
});

test("switching from sms to push routes the next notification to push only (AC6)", () => {
  const { store, pushSender, smsSender, dispatcher } = setUp();
  const firstEvent = { orderId: "order-1", status: "shipped" };
  const secondEvent = { orderId: "order-1", status: "delivered" };

  store.setPreference("customer-1", "sms");
  dispatcher.dispatchOrderStatusNotification("customer-1", firstEvent);

  store.setPreference("customer-1", "push");
  dispatcher.dispatchOrderStatusNotification("customer-1", secondEvent);

  assert.equal(smsSender.calls.length, 1);
  assert.deepEqual(smsSender.calls[0].event, firstEvent);
  assert.equal(pushSender.calls.length, 1);
  assert.deepEqual(pushSender.calls[0].event, secondEvent);
});
