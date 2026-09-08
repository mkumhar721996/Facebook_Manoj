const FIELD_LABELS = {
  line1: "Address line 1",
  line2: "Address line 2",
  city: "City",
  region: "Region",
  postalCode: "Postal code",
  country: "Country",
};

const REQUIRED_FIELDS = ["line1", "city", "postalCode", "country"];

// Address fields are persisted and later rendered back to the customer (saved addresses list,
// order confirmation) — reject HTML markup characters and cap length to prevent stored XSS.
const MAX_FIELD_LENGTH = 200;
const UNSAFE_CHARS_PATTERN = /[<>]/;

function validateAddress(address = {}) {
  const errors = {};

  for (const field of REQUIRED_FIELDS) {
    const value = address[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  for (const field of Object.keys(FIELD_LABELS)) {
    if (errors[field]) continue;
    const value = address[field];
    if (typeof value !== "string" || value.length === 0) continue;

    if (value.length > MAX_FIELD_LENGTH) {
      errors[field] = `${FIELD_LABELS[field]} must be ${MAX_FIELD_LENGTH} characters or fewer`;
    } else if (UNSAFE_CHARS_PATTERN.test(value)) {
      errors[field] = `${FIELD_LABELS[field]} contains invalid characters`;
    }
  }

  return errors;
}

function isAddressValid(address) {
  return Object.keys(validateAddress(address)).length === 0;
}

module.exports = { validateAddress, isAddressValid, REQUIRED_FIELDS };
