const test = require("node:test");
const assert = require("node:assert/strict");
const { createInMemoryAddressRepository } = require("../repositories/addressRepository");
const { createAddressService } = require("../services/addressService");
const { createCheckoutService } = require("../services/checkoutService");
const { createCheckoutHandler } = require("./checkout");

function buildHandler(seed) {
  const repository = createInMemoryAddressRepository({ seed });
  const addressService = createAddressService({ repository });
  const checkoutService = createCheckoutService({ addressService });
  return { handler: createCheckoutHandler({ checkoutService }), addressService };
}

const validNewAddress = { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" };

test("POST place-order with a savedAddressId returns 201 and the order's delivery address (AC3)", () => {
  const { handler } = buildHandler([
    { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
  ]);

  const response = handler.placeOrder("cust-1", { savedAddressId: "a1" });

  assert.equal(response.status, 201);
  assert.equal(response.body.order.deliveryAddress.line1, "1 Main St");
});

test("POST place-order with a new address and saveToAccount=true saves the address (AC5)", () => {
  const { handler, addressService } = buildHandler([]);

  const response = handler.placeOrder("cust-1", { newAddress: validNewAddress, saveToAccount: true });

  assert.equal(response.status, 201);
  assert.equal(addressService.getSavedAddresses("cust-1").length, 1);
});

test("POST place-order with an invalid new address returns 400 with field errors and blocks submission (AC8/AC9)", () => {
  const { handler, addressService } = buildHandler([]);

  const response = handler.placeOrder("cust-1", { newAddress: { line1: "" }, saveToAccount: true });

  assert.equal(response.status, 400);
  assert.equal(response.body.fieldErrors.line1, "Address line 1 is required");
  assert.deepEqual(addressService.getSavedAddresses("cust-1"), []);
});
