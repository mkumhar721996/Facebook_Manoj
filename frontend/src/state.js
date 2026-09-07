export function createInitialState(overrides = {}) {
  return {
    search: overrides.search || "",
    cuisine: overrides.cuisine || "",
    minRating: overrides.minRating ?? null,
    maxDeliveryMinutes: overrides.maxDeliveryMinutes ?? null,
    status: "idle",
    restaurants: [],
  };
}

export function reduce(state, action) {
  switch (action.type) {
    case "SET_SEARCH":
      return { ...state, search: action.value };
    case "SET_CUISINE":
      return { ...state, cuisine: action.value };
    case "SET_MIN_RATING":
      return { ...state, minRating: action.value };
    case "SET_MAX_DELIVERY":
      return { ...state, maxDeliveryMinutes: action.value };
    case "CLEAR_FILTERS":
      return {
        ...state,
        search: "",
        cuisine: "",
        minRating: null,
        maxDeliveryMinutes: null,
      };
    case "FETCH_START":
      return { ...state, status: "loading" };
    case "FETCH_SUCCESS":
      return { ...state, status: "success", restaurants: action.restaurants };
    case "FETCH_ERROR":
      return { ...state, status: "error" };
    default:
      return state;
  }
}
