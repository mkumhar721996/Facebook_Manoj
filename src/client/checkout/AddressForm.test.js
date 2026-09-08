const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createAddressFormState,
  updateField,
  toggleSaveToAccount,
  submitAddressForm,
  SAVE_ADDRESS_CHECKBOX_LABEL,
} = require("./AddressForm");

test("the save-to-account checkbox is unchecked by default (AC4)", () => {
  const state = createAddressFormState();

  assert.equal(state.saveToAccount, false);
  assert.equal(typeof SAVE_ADDRESS_CHECKBOX_LABEL, "string");
  assert.match(SAVE_ADDRESS_CHECKBOX_LABEL, /save.*address.*account/i);
});

test("updateField updates a single address field without touching the others", () => {
  let state = createAddressFormState();
  state = updateField(state, "line1", "1 Main St");
  state = updateField(state, "city", "Metropolis");

  assert.equal(state.fields.line1, "1 Main St");
  assert.equal(state.fields.city, "Metropolis");
});

test("toggleSaveToAccount flips the opt-in flag", () => {
  let state = createAddressFormState();
  state = toggleSaveToAccount(state, true);

  assert.equal(state.saveToAccount, true);
});

test("submitting an incomplete form produces an inline error for each missing/invalid field (AC8)", () => {
  const state = createAddressFormState();

  const result = submitAddressForm(state, () => assert.fail("onValid should not be called"));

  assert.equal(result.blocked, true);
  assert.equal(result.state.errors.line1, "Address line 1 is required");
  assert.equal(result.state.errors.city, "City is required");
  assert.equal(result.state.errors.postalCode, "Postal code is required");
  assert.equal(result.state.errors.country, "Country is required");
});

test("submitting an invalid form does not invoke the onValid/proceed callback (AC9)", () => {
  const state = createAddressFormState();
  let called = false;

  submitAddressForm(state, () => {
    called = true;
  });

  assert.equal(called, false);
});

test("submitting a valid form invokes onValid with the address and saveToAccount flag", () => {
  let state = createAddressFormState();
  state = updateField(state, "line1", "1 Main St");
  state = updateField(state, "city", "Metropolis");
  state = updateField(state, "postalCode", "12345");
  state = updateField(state, "country", "US");
  state = toggleSaveToAccount(state, true);

  let receivedSelection;
  const result = submitAddressForm(state, (selection) => {
    receivedSelection = selection;
  });

  assert.equal(result.blocked, false);
  assert.deepEqual(result.state.errors, {});
  assert.equal(receivedSelection.saveToAccount, true);
  assert.equal(receivedSelection.newAddress.line1, "1 Main St");
});
