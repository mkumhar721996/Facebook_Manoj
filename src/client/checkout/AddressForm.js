const { validateAddress, isAddressValid } = require("../../shared/validation/addressValidation");

const SAVE_ADDRESS_CHECKBOX_LABEL = "Save this address to my account";

function createAddressFormState(initialFields = {}) {
  return {
    fields: { line1: "", line2: "", city: "", region: "", postalCode: "", country: "", ...initialFields },
    saveToAccount: false,
    errors: {},
  };
}

function updateField(state, field, value) {
  return { ...state, fields: { ...state.fields, [field]: value } };
}

function toggleSaveToAccount(state, checked) {
  return { ...state, saveToAccount: checked };
}

function submitAddressForm(state, onValid) {
  if (!isAddressValid(state.fields)) {
    const errors = validateAddress(state.fields);
    return { blocked: true, state: { ...state, errors } };
  }

  onValid({ newAddress: state.fields, saveToAccount: state.saveToAccount });
  return { blocked: false, state: { ...state, errors: {} } };
}

module.exports = {
  createAddressFormState,
  updateField,
  toggleSaveToAccount,
  submitAddressForm,
  SAVE_ADDRESS_CHECKBOX_LABEL,
};
