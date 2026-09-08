function createOrderSummary() {
  let selectedPaymentMethod = null;

  function setPaymentMethod(methodId) {
    selectedPaymentMethod = methodId;
  }

  function getSelectedPaymentMethod() {
    return selectedPaymentMethod;
  }

  return { setPaymentMethod, getSelectedPaymentMethod };
}

module.exports = { createOrderSummary };
