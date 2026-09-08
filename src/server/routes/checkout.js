const { ValidationError } = require("../services/checkoutService");
const logger = require("../logger");

function createCheckoutHandler({ checkoutService }) {
  function placeOrder(customerId, checkoutInput) {
    try {
      const order = checkoutService.placeOrder(customerId, checkoutInput);
      return { status: 201, body: { order } };
    } catch (err) {
      if (err instanceof ValidationError) {
        return { status: 400, body: { fieldErrors: err.fieldErrors } };
      }
      logger.error("Checkout failed", {
        customerId,
        savedAddressId: checkoutInput.savedAddressId,
        error: err.message,
      });
      throw err;
    }
  }

  return { placeOrder };
}

module.exports = { createCheckoutHandler };
