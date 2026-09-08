function createAddressesHandler({ addressService }) {
  function listSavedAddresses(customerId) {
    return { status: 200, body: { addresses: addressService.getSavedAddresses(customerId) } };
  }

  return { listSavedAddresses };
}

module.exports = { createAddressesHandler };
