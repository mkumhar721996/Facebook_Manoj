const { evaluateCodEligibility } = require("./codEligibility");

const METHOD_LABELS = {
  card: "Card",
  upi: "UPI/Wallet",
  cod: "Cash on Delivery",
};

function createPaymentMethodSelector({
  orderValue,
  codMaxThreshold,
  isAddressServiceable,
}) {
  let state = { orderValue, codMaxThreshold, isAddressServiceable };
  let selectedMethod = null;

  function getCodEligibility() {
    return evaluateCodEligibility(state);
  }

  function getAvailableOptions() {
    const codEligibility = getCodEligibility();
    const ids = codEligibility.eligible ? ["card", "upi", "cod"] : ["card", "upi"];

    return ids.map((id) => ({
      id,
      label: METHOD_LABELS[id],
      selectable: true,
    }));
  }

  function getCodUnavailableReason() {
    const codEligibility = getCodEligibility();
    return codEligibility.eligible ? null : codEligibility.reason;
  }

  function getSelectedMethod() {
    return selectedMethod;
  }

  function selectMethod(methodId) {
    const available = getAvailableOptions().map((o) => o.id);
    if (!available.includes(methodId)) {
      throw new Error(`Payment method "${methodId}" is not available for selection.`);
    }
    selectedMethod = methodId;
  }

  function deselectCodIfIneligible() {
    if (selectedMethod === "cod" && !getCodEligibility().eligible) {
      selectedMethod = null;
    }
  }

  function updateOrderValue(newOrderValue) {
    state = { ...state, orderValue: newOrderValue };
    deselectCodIfIneligible();
  }

  function updateDeliveryAddress({ isAddressServiceable: newIsAddressServiceable }) {
    state = { ...state, isAddressServiceable: newIsAddressServiceable };
    deselectCodIfIneligible();
  }

  function proceed() {
    if (!selectedMethod) {
      throw new Error(
        "Please select a payment method before proceeding."
      );
    }

    return {
      method: selectedMethod,
      requiresCardInput: selectedMethod === "card",
      requiresUpiInput: selectedMethod === "upi",
    };
  }

  return {
    getAvailableOptions,
    getCodUnavailableReason,
    getSelectedMethod,
    selectMethod,
    updateOrderValue,
    updateDeliveryAddress,
    proceed,
  };
}

module.exports = { createPaymentMethodSelector };
