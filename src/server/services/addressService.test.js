const test = require("node:test");
const assert = require("node:assert/strict");
const { createInMemoryAddressRepository } = require("../repositories/addressRepository");
const { createAddressService } = require("./addressService");

function buildService(seed) {
  const repository = createInMemoryAddressRepository({ seed });
  return createAddressService({ repository });
}

test("getSavedAddresses returns all addresses stored for that customer (AC1)", () => {
  const service = buildService([
    { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
    { id: "a2", customerId: "cust-1", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: false },
  ]);

  const addresses = service.getSavedAddresses("cust-1");

  assert.equal(addresses.length, 2);
});

test("getSavedAddresses' result includes the default address, identifiable via isDefault (AC2)", () => {
  const service = buildService([
    { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: false },
    { id: "a2", customerId: "cust-1", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: true },
  ]);

  const addresses = service.getSavedAddresses("cust-1");
  const defaultAddress = addresses.find((a) => a.isDefault);

  assert.equal(defaultAddress.id, "a2");
});

test("saveAddress persists a new address and makes it retrievable via getSavedAddresses", () => {
  const service = buildService([]);

  service.saveAddress("cust-1", { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" });

  const addresses = service.getSavedAddresses("cust-1");
  assert.equal(addresses.length, 1);
  assert.equal(addresses[0].line1, "9 New St");
});

test("resolveDeliveryAddress with a savedAddressId returns that saved address's fields (AC3)", () => {
  const service = buildService([
    { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
  ]);

  const resolved = service.resolveDeliveryAddress("cust-1", { savedAddressId: "a1" });

  assert.equal(resolved.line1, "1 Main St");
  assert.equal(resolved.city, "Springfield");
});

test("resolveDeliveryAddress with a savedAddressId that does not belong to the customer throws", () => {
  const service = buildService([
    { id: "a1", customerId: "cust-2", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
  ]);

  assert.throws(() => service.resolveDeliveryAddress("cust-1", { savedAddressId: "a1" }));
});

test("resolveDeliveryAddress with a newAddress returns that address's fields", () => {
  const service = buildService([]);

  const resolved = service.resolveDeliveryAddress("cust-1", {
    newAddress: { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" },
  });

  assert.equal(resolved.line1, "9 New St");
});
