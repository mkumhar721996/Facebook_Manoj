const FIELD_LABELS = {
  line1: "Address line 1",
  city: "City",
  postalCode: "Postal code",
  country: "Country",
};

const REQUIRED_FIELDS = Object.keys(FIELD_LABELS);

function validateAddress(address = {}) {
  const errors = {};

  for (const field of REQUIRED_FIELDS) {
    const value = address[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  return errors;
}

function isAddressValid(address) {
  return Object.keys(validateAddress(address)).length === 0;
}

module.exports = { validateAddress, isAddressValid, REQUIRED_FIELDS };
