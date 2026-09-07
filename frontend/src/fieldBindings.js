export function parseNullableNumber(value) {
  return value === "" ? null : Number(value);
}

function identity(value) {
  return value;
}

export const FIELD_BINDINGS = [
  { testId: "search-input", event: "input", action: "setSearch", parse: identity },
  { testId: "cuisine-filter", event: "input", action: "setCuisine", parse: identity },
  { testId: "min-rating-filter", event: "change", action: "setMinRating", parse: parseNullableNumber },
  {
    testId: "max-delivery-filter",
    event: "change",
    action: "setMaxDeliveryMinutes",
    parse: parseNullableNumber,
  },
];
