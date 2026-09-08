const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateCodEligibility } = require("../../src/payment/codEligibility");

test("AC1/AC2: order value within COD max threshold and address serviceable -> eligible", () => {
  const result = evaluateCodEligibility({
    orderValue: 500,
    codMaxThreshold: 1000,
    isAddressServiceable: true,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.reason, null);
});

test("AC2: order value exceeds COD max threshold -> ineligible due to order value", () => {
  const result = evaluateCodEligibility({
    orderValue: 1500,
    codMaxThreshold: 1000,
    isAddressServiceable: true,
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason, /order value/i);
});

test("AC3: delivery address outside COD serviceable area -> ineligible due to address", () => {
  const result = evaluateCodEligibility({
    orderValue: 500,
    codMaxThreshold: 1000,
    isAddressServiceable: false,
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason, /address/i);
});
