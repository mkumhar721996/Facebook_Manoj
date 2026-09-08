const COD_UNAVAILABLE_ORDER_VALUE_REASON =
  "Cash on Delivery is unavailable because the order value exceeds the maximum allowed for COD.";
const COD_UNAVAILABLE_ADDRESS_REASON =
  "Cash on Delivery is unavailable for the selected delivery address.";

function evaluateCodEligibility({ orderValue, codMaxThreshold, isAddressServiceable }) {
  if (!isAddressServiceable) {
    return { eligible: false, reason: COD_UNAVAILABLE_ADDRESS_REASON };
  }

  if (orderValue > codMaxThreshold) {
    return { eligible: false, reason: COD_UNAVAILABLE_ORDER_VALUE_REASON };
  }

  return { eligible: true, reason: null };
}

module.exports = {
  evaluateCodEligibility,
  COD_UNAVAILABLE_ORDER_VALUE_REASON,
  COD_UNAVAILABLE_ADDRESS_REASON,
};
