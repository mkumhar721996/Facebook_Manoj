const crypto = require("node:crypto");

function createInMemoryAddressRepository(options = {}) {
  const addresses = (options.seed || []).map((address) => ({ ...address }));

  function listByCustomer(customerId) {
    return addresses.filter((a) => a.customerId === customerId).map((a) => ({ ...a }));
  }

  function findById(customerId, addressId) {
    const found = addresses.find((a) => a.customerId === customerId && a.id === addressId);
    return found ? { ...found } : undefined;
  }

  function add(customerId, addressFields) {
    const saved = {
      id: crypto.randomUUID(),
      customerId,
      isDefault: false,
      ...addressFields,
    };
    addresses.push(saved);
    return { ...saved };
  }

  return { listByCustomer, findById, add };
}

module.exports = { createInMemoryAddressRepository };
