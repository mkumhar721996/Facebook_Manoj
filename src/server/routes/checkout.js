const { ValidationError } = require("../services/checkoutService");

function createCheckoutHandler({ checkoutService }) {
  function placeOrder(customerId, checkoutInput) {
    try {
      const order = checkoutService.placeOrder(customerId, checkoutInput);
      return { status: 201, body: { order } };
    } catch (err) {
      if (err instanceof ValidationError) {
        return { status: 400, body: { fieldErrors: err.fieldErrors } };
      }
      throw err;
    }
  }

  return { placeOrder };
}

module.exports = { createCheckoutHandler };
