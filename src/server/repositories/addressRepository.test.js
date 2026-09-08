const test = require("node:test");
const assert = require("node:assert/strict");
const { createInMemoryAddressRepository } = require("./addressRepository");

test("listByCustomer returns all saved addresses for that customer (AC1)", () => {
  const repo = createInMemoryAddressRepository({
    seed: [
      { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true },
      { id: "a2", customerId: "cust-1", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: false },
      { id: "a3", customerId: "cust-2", line1: "3 Elm St", city: "Shelbyville", postalCode: "33333", country: "US", isDefault: true },
    ],
  });

  const addresses = repo.listByCustomer("cust-1");

  assert.equal(addresses.length, 2);
  assert.deepEqual(
    addresses.map((a) => a.id).sort(),
    ["a1", "a2"]
  );
});

test("listByCustomer returns an empty array when the customer has no saved addresses", () => {
  const repo = createInMemoryAddressRepository();

  assert.deepEqual(repo.listByCustomer("cust-1"), []);
});

test("listByCustomer includes the address flagged isDefault, identifiable in the result (AC2)", () => {
  const repo = createInMemoryAddressRepository({
    seed: [
      { id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: false },
      { id: "a2", customerId: "cust-1", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: true },
    ],
  });

  const addresses = repo.listByCustomer("cust-1");
  const defaultAddresses = addresses.filter((a) => a.isDefault);

  assert.equal(defaultAddresses.length, 1);
  assert.equal(defaultAddresses[0].id, "a2");
});

test("findById returns the matching address for a customer", () => {
  const repo = createInMemoryAddressRepository({
    seed: [{ id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true }],
  });

  const found = repo.findById("cust-1", "a1");

  assert.equal(found.line1, "1 Main St");
});

test("findById returns undefined when the address belongs to a different customer", () => {
  const repo = createInMemoryAddressRepository({
    seed: [{ id: "a1", customerId: "cust-1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: true }],
  });

  assert.equal(repo.findById("cust-2", "a1"), undefined);
});

test("add stores a new address for the customer as not-default and assigns it an id", () => {
  const repo = createInMemoryAddressRepository();

  const saved = repo.add("cust-1", { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" });

  assert.ok(saved.id);
  assert.equal(saved.isDefault, false);
  assert.deepEqual(repo.listByCustomer("cust-1").map((a) => a.id), [saved.id]);
});
