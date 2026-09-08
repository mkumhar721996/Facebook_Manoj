const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAddress } = require("./addressValidation");

test("returns an error for every missing required field (AC8)", () => {
  const errors = validateAddress({});

  assert.equal(errors.line1, "Address line 1 is required");
  assert.equal(errors.city, "City is required");
  assert.equal(errors.postalCode, "Postal code is required");
  assert.equal(errors.country, "Country is required");
});

test("returns an error for a field that is present but blank/whitespace-only", () => {
  const errors = validateAddress({ line1: "   ", city: "Metropolis", postalCode: "12345", country: "US" });

  assert.equal(errors.line1, "Address line 1 is required");
  assert.equal(Object.keys(errors).length, 1);
});

test("returns no errors for a fully valid address", () => {
  const errors = validateAddress({ line1: "1 Main St", city: "Metropolis", postalCode: "12345", country: "US" });

  assert.deepEqual(errors, {});
});

test("optional fields (line2) are not validated", () => {
  const errors = validateAddress({ line1: "1 Main St", line2: "", city: "Metropolis", postalCode: "12345", country: "US" });

  assert.deepEqual(errors, {});
});

test("rejects a field containing HTML markup characters (stored XSS prevention)", () => {
  const errors = validateAddress({
    line1: "<img src=x onerror=alert(1)>",
    city: "Metropolis",
    postalCode: "12345",
    country: "US",
  });

  assert.equal(errors.line1, "Address line 1 contains invalid characters");
});

test("rejects an optional field containing HTML markup characters", () => {
  const errors = validateAddress({
    line1: "1 Main St",
    line2: "<script>alert(1)</script>",
    city: "Metropolis",
    postalCode: "12345",
    country: "US",
  });

  assert.equal(errors.line2, "Address line 2 contains invalid characters");
});

test("rejects a field that exceeds the maximum allowed length", () => {
  const errors = validateAddress({
    line1: "a".repeat(201),
    city: "Metropolis",
    postalCode: "12345",
    country: "US",
  });

  assert.equal(errors.line1, "Address line 1 must be 200 characters or fewer");
});

test("isAddressValid returns false when there are errors and true when there are none", () => {
  const { isAddressValid } = require("./addressValidation");

  assert.equal(isAddressValid({}), false);
  assert.equal(isAddressValid({ line1: "1 Main St", city: "Metropolis", postalCode: "12345", country: "US" }), true);
});
