const test = require("node:test");
const assert = require("node:assert/strict");
const { createInMemoryAddressRepository } = require("../repositories/addressRepository");
const { createAddressService } = require("../services/addressService");
const { createAddressesHandler } = require("./addresses");

test("GET saved addresses returns 200 with all saved addresses for the customer (AC1)", () => {
  const repository = createInMemoryAddressRepository({
    seed: [
      { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
      { id: "a2", customerId: "cust-1", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: false },
    ],
  });
  const addressService = createAddressService({ repository });
  const handler = createAddressesHandler({ addressService });

  const response = handler.listSavedAddresses("cust-1");

  assert.equal(response.status, 200);
  assert.equal(response.body.addresses.length, 2);
});

test("GET saved addresses response identifies which address is the default (AC2)", () => {
  const repository = createInMemoryAddressRepository({
    seed: [{ id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true }],
  });
  const addressService = createAddressService({ repository });
  const handler = createAddressesHandler({ addressService });

  const response = handler.listSavedAddresses("cust-1");

  assert.equal(response.body.addresses[0].isDefault, true);
});
