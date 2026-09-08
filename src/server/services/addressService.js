function createAddressService({ repository }) {
  function getSavedAddresses(customerId) {
    return repository.listByCustomer(customerId);
  }

  function saveAddress(customerId, addressFields) {
    return repository.add(customerId, addressFields);
  }

  function resolveDeliveryAddress(customerId, selection) {
    if (selection.savedAddressId) {
      const saved = repository.findById(customerId, selection.savedAddressId);
      if (!saved) {
        throw new Error(`Saved address ${selection.savedAddressId} not found for customer ${customerId}`);
      }
      return saved;
    }

    if (selection.newAddress) {
      return { ...selection.newAddress };
    }

    throw new Error("A savedAddressId or newAddress must be provided");
  }

  return { getSavedAddresses, saveAddress, resolveDeliveryAddress };
}

module.exports = { createAddressService };
