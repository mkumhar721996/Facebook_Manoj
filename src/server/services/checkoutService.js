const crypto = require("node:crypto");
const { validateAddress, isAddressValid } = require("../../shared/validation/addressValidation");

class ValidationError extends Error {
  constructor(fieldErrors) {
    super("Address validation failed");
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

function createCheckoutService({ addressService }) {
  function placeOrder(customerId, checkoutInput) {
    const { savedAddressId, newAddress, saveToAccount } = checkoutInput;

    if (!savedAddressId && newAddress) {
      const fieldErrors = validateAddress(newAddress);
      if (!isAddressValid(newAddress)) {
        throw new ValidationError(fieldErrors);
      }
    }

    const deliveryAddress = addressService.resolveDeliveryAddress(customerId, { savedAddressId, newAddress });

    if (!savedAddressId && newAddress && saveToAccount) {
      addressService.saveAddress(customerId, newAddress);
    }

    return {
      id: crypto.randomUUID(),
      customerId,
      deliveryAddress,
    };
  }

  return { placeOrder };
}

module.exports = { createCheckoutService, ValidationError };
