const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createPaymentMethodSelector,
} = require("../../src/payment/paymentMethodSelector");
const {
  COD_UNAVAILABLE_ORDER_VALUE_REASON,
  COD_UNAVAILABLE_ADDRESS_REASON,
} = require("../../src/payment/codEligibility");

function makeSelector(overrides = {}) {
  return createPaymentMethodSelector({
    orderValue: 500,
    codMaxThreshold: 1000,
    isAddressServiceable: true,
    ...overrides,
  });
}

test("AC1: card, upi, and cod are all selectable when within COD threshold and address is serviceable", () => {
  const selector = makeSelector();

  const options = selector.getAvailableOptions();

  assert.deepEqual(
    options.map((o) => o.id).sort(),
    ["card", "cod", "upi"]
  );
  assert.ok(options.every((o) => o.selectable));
  assert.equal(selector.getCodUnavailableReason(), null);
});

test("AC2: order value exceeds COD max threshold -> cod excluded with order-value message", () => {
  const selector = makeSelector({ orderValue: 1500, codMaxThreshold: 1000 });

  const options = selector.getAvailableOptions();

  assert.deepEqual(
    options.map((o) => o.id).sort(),
    ["card", "upi"]
  );
  assert.equal(selector.getCodUnavailableReason(), COD_UNAVAILABLE_ORDER_VALUE_REASON);
});

test("AC3: address outside serviceable area -> cod excluded with address message", () => {
  const selector = makeSelector({ isAddressServiceable: false });

  const options = selector.getAvailableOptions();

  assert.deepEqual(
    options.map((o) => o.id).sort(),
    ["card", "upi"]
  );
  assert.equal(selector.getCodUnavailableReason(), COD_UNAVAILABLE_ADDRESS_REASON);
});

test("AC4: selecting card and proceeding requires card entry/saved-card selection", () => {
  const selector = makeSelector();

  selector.selectMethod("card");
  const result = selector.proceed();

  assert.equal(result.requiresCardInput, true);
  assert.equal(result.requiresUpiInput, false);
});

test("AC5: selecting upi and proceeding requires UPI details/linked-wallet selection", () => {
  const selector = makeSelector();

  selector.selectMethod("upi");
  const result = selector.proceed();

  assert.equal(result.requiresUpiInput, true);
  assert.equal(result.requiresCardInput, false);
});

test("AC6: selecting cod and proceeding requires no payment credentials", () => {
  const selector = makeSelector();

  selector.selectMethod("cod");
  const result = selector.proceed();

  assert.equal(result.requiresCardInput, false);
  assert.equal(result.requiresUpiInput, false);
});

test("AC8: cod selected then order value rises above COD max -> auto-deselected with order-value message", () => {
  const selector = makeSelector();
  selector.selectMethod("cod");

  selector.updateOrderValue(1500);

  assert.equal(selector.getSelectedMethod(), null);
  assert.equal(selector.getCodUnavailableReason(), COD_UNAVAILABLE_ORDER_VALUE_REASON);
});

test("AC9: cod selected then address moves outside serviceable area -> auto-deselected with address message", () => {
  const selector = makeSelector();
  selector.selectMethod("cod");

  selector.updateDeliveryAddress({ isAddressServiceable: false });

  assert.equal(selector.getSelectedMethod(), null);
  assert.equal(selector.getCodUnavailableReason(), COD_UNAVAILABLE_ADDRESS_REASON);
});

test("AC10: after cod is auto-deselected, proceed() requires selecting a different payment method", () => {
  const selector = makeSelector();
  selector.selectMethod("cod");
  selector.updateOrderValue(1500);

  assert.throws(() => selector.proceed(), /select a payment method/i);
});
