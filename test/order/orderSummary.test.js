const test = require("node:test");
const assert = require("node:assert/strict");
const { createOrderSummary } = require("../../src/order/orderSummary");
const {
  createPaymentMethodSelector,
} = require("../../src/payment/paymentMethodSelector");

function proceedWith(methodId) {
  const selector = createPaymentMethodSelector({
    orderValue: 500,
    codMaxThreshold: 1000,
    isAddressServiceable: true,
  });
  selector.selectMethod(methodId);
  return selector.proceed();
}

test("AC7: order summary reflects the selected payment method for card, upi, and cod", () => {
  for (const methodId of ["card", "upi", "cod"]) {
    const proceedResult = proceedWith(methodId);
    const summary = createOrderSummary();

    summary.setPaymentMethod(proceedResult.method);

    assert.equal(summary.getSelectedPaymentMethod(), methodId);
  }
});
