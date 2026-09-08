const logger = require("../logger");

function createAddressesHandler({ addressService }) {
  function listSavedAddresses(customerId) {
    try {
      return { status: 200, body: { addresses: addressService.getSavedAddresses(customerId) } };
    } catch (err) {
      logger.error("Failed to list saved addresses", { customerId, error: err.message });
      return { status: 500, body: { error: "Internal error" } };
    }
  }

  return { listSavedAddresses };
}

module.exports = { createAddressesHandler };
