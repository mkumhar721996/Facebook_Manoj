const test = require("node:test");
const assert = require("node:assert/strict");
const { createInMemoryAddressRepository } = require("../repositories/addressRepository");
const { createAddressService } = require("./addressService");
const { createCheckoutService } = require("./checkoutService");

function buildServices(seed) {
  const repository = createInMemoryAddressRepository({ seed });
  const addressService = createAddressService({ repository });
  const checkoutService = createCheckoutService({ addressService });
  return { addressService, checkoutService };
}

const validNewAddress = { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" };

test("placeOrder with a savedAddressId sets the order's deliveryAddress to that saved address (AC3)", () => {
  const { checkoutService } = buildServices([
    { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
  ]);

  const order = checkoutService.placeOrder("cust-1", { savedAddressId: "a1" });

  assert.equal(order.deliveryAddress.line1, "1 Main St");
});

test("placeOrder with a new address and saveToAccount=true saves the address to the customer's account (AC5)", () => {
  const { checkoutService, addressService } = buildServices([]);

  const order = checkoutService.placeOrder("cust-1", { newAddress: validNewAddress, saveToAccount: true });

  assert.equal(order.deliveryAddress.line1, validNewAddress.line1);
  const saved = addressService.getSavedAddresses("cust-1");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].line1, validNewAddress.line1);
});

test("placeOrder with a new address and saveToAccount=false still uses it as the order's delivery address (AC6)", () => {
  const { checkoutService } = buildServices([]);

  const order = checkoutService.placeOrder("cust-1", { newAddress: validNewAddress, saveToAccount: false });

  assert.equal(order.deliveryAddress.line1, validNewAddress.line1);
});

test("placeOrder with a new address and saveToAccount=false does not add it to saved addresses (AC7)", () => {
  const { checkoutService, addressService } = buildServices([]);

  checkoutService.placeOrder("cust-1", { newAddress: validNewAddress, saveToAccount: false });

  assert.deepEqual(addressService.getSavedAddresses("cust-1"), []);
});

test("placeOrder with an invalid new address throws and does not create an order or save the address (AC9)", () => {
  const { checkoutService, addressService } = buildServices([]);

  assert.throws(() => checkoutService.placeOrder("cust-1", { newAddress: { line1: "" }, saveToAccount: true }));

  assert.deepEqual(addressService.getSavedAddresses("cust-1"), []);
});

test("placeOrder with an invalid new address throws a ValidationError carrying the field errors", () => {
  const { checkoutService } = buildServices([]);

  try {
    checkoutService.placeOrder("cust-1", { newAddress: {} });
    assert.fail("expected placeOrder to throw");
  } catch (err) {
    assert.equal(err.name, "ValidationError");
    assert.equal(err.fieldErrors.line1, "Address line 1 is required");
  }
});
