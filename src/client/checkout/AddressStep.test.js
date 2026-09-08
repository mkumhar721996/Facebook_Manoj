const test = require("node:test");
const assert = require("node:assert/strict");
const { createAddressStepState, selectSavedAddress, switchToNewAddress, getCheckoutSelection } = require("./AddressStep");

const addresses = [
  { id: "a1", line1: "1 Main St", city: "Springfield", postalCode: "11111", country: "US", isDefault: false },
  { id: "a2", line1: "2 Oak St", city: "Springfield", postalCode: "22222", country: "US", isDefault: true },
  { id: "a3", line1: "3 Elm St", city: "Shelbyville", postalCode: "33333", country: "US", isDefault: false },
];

test("all saved addresses are listed in the step's state (AC1)", () => {
  const state = createAddressStepState(addresses);

  assert.equal(state.addresses.length, 3);
});

test("the address flagged isDefault is pre-selected on initial state, without any user interaction (AC2)", () => {
  const state = createAddressStepState(addresses);

  assert.equal(state.selectedAddressId, "a2");
  assert.equal(state.mode, "saved");
});

test("when no address is flagged as default, the first saved address is pre-selected", () => {
  const noDefault = addresses.map((a) => ({ ...a, isDefault: false }));
  const state = createAddressStepState(noDefault);

  assert.equal(state.selectedAddressId, "a1");
});

test("selecting a saved address updates the selection used for the order (AC3)", () => {
  let state = createAddressStepState(addresses);
  state = selectSavedAddress(state, "a3");

  assert.equal(state.selectedAddressId, "a3");
  assert.deepEqual(getCheckoutSelection(state), { savedAddressId: "a3" });
});

test("switching to 'enter a new address' clears the saved-address selection", () => {
  let state = createAddressStepState(addresses);
  state = switchToNewAddress(state);

  assert.equal(state.mode, "new");
  assert.equal(state.selectedAddressId, null);
});

test("getCheckoutSelection in 'new' mode returns the provided new address fields", () => {
  let state = createAddressStepState(addresses);
  state = switchToNewAddress(state);

  const newAddress = { line1: "9 New St", city: "Capital City", postalCode: "99999", country: "US" };
  assert.deepEqual(getCheckoutSelection(state, newAddress), { newAddress });
});

test("with no saved addresses, the step starts in 'new' mode with no selection", () => {
  const state = createAddressStepState([]);

  assert.equal(state.mode, "new");
  assert.equal(state.selectedAddressId, null);
  assert.equal(state.addresses.length, 0);
});
