import { createInitialState, reduce } from "./state.js";
import { renderApp } from "./render.js";
import { fetchRestaurants } from "./api.js";
import { parseFiltersFromSearch, buildSearchString } from "./urlState.js";

export function createController({
  fetchImpl,
  baseUrl,
  initialSearch = "",
  onStateChange,
  onUrlChange,
  logger = console,
}) {
  let state = createInitialState(parseFiltersFromSearch(initialSearch));

  function setState(nextState) {
    state = nextState;
    onStateChange(state);
  }

  function syncUrl() {
    onUrlChange(buildSearchString(state));
  }

  async function load() {
    setState(reduce(state, { type: "FETCH_START" }));
    try {
      const restaurants = await fetchRestaurants(state, { fetchImpl, baseUrl, logger });
      setState(reduce(state, { type: "FETCH_SUCCESS", restaurants }));
    } catch (error) {
      logger.error({
        event: "restaurant_search_failed",
        filters: {
          search: state.search,
          cuisine: state.cuisine,
          minRating: state.minRating,
          maxDeliveryMinutes: state.maxDeliveryMinutes,
        },
        error,
      });
      setState(reduce(state, { type: "FETCH_ERROR" }));
    }
  }

  async function setSearch(value) {
    setState(reduce(state, { type: "SET_SEARCH", value }));
    syncUrl();
    await load();
  }

  async function setCuisine(value) {
    setState(reduce(state, { type: "SET_CUISINE", value }));
    syncUrl();
    await load();
  }

  async function setMinRating(value) {
    setState(reduce(state, { type: "SET_MIN_RATING", value }));
    syncUrl();
    await load();
  }

  async function setMaxDeliveryMinutes(value) {
    setState(reduce(state, { type: "SET_MAX_DELIVERY", value }));
    syncUrl();
    await load();
  }

  async function clearFilters() {
    setState(reduce(state, { type: "CLEAR_FILTERS" }));
    syncUrl();
    await load();
  }

  async function retry() {
    await load();
  }

  return {
    getState: () => state,
    render: () => renderApp(state),
    load,
    setSearch,
    setCuisine,
    setMinRating,
    setMaxDeliveryMinutes,
    clearFilters,
    retry,
  };
}
