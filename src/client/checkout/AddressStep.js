function createAddressStepState(addresses) {
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return {
    addresses,
    selectedAddressId: defaultAddress ? defaultAddress.id : null,
    mode: addresses.length > 0 ? "saved" : "new",
  };
}

function selectSavedAddress(state, addressId) {
  return { ...state, mode: "saved", selectedAddressId: addressId };
}

function switchToNewAddress(state) {
  return { ...state, mode: "new", selectedAddressId: null };
}

function getCheckoutSelection(state, newAddress) {
  if (state.mode === "saved") {
    return { savedAddressId: state.selectedAddressId };
  }
  return { newAddress };
}

module.exports = { createAddressStepState, selectSavedAddress, switchToNewAddress, getCheckoutSelection };
