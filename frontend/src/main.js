import { createController } from "./controller.js";

const root = document.getElementById("root");
const backendBaseUrl = window.__BACKEND_BASE_URL__ || window.location.origin;

const controller = createController({
  fetchImpl: window.fetch.bind(window),
  baseUrl: backendBaseUrl,
  initialSearch: window.location.search,
  onStateChange: render,
  onUrlChange: (search) => {
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  },
});

function render() {
  root.innerHTML = controller.render();
  attachHandlers();
}

function attachHandlers() {
  root.querySelector('[data-testid="search-input"]').addEventListener("input", (event) => {
    controller.setSearch(event.target.value);
  });

  root.querySelector('[data-testid="cuisine-filter"]').addEventListener("change", (event) => {
    controller.setCuisine(event.target.value);
  });

  root.querySelector('[data-testid="min-rating-filter"]').addEventListener("change", (event) => {
    const value = event.target.value === "" ? null : Number(event.target.value);
    controller.setMinRating(value);
  });

  root.querySelector('[data-testid="max-delivery-filter"]').addEventListener("change", (event) => {
    const value = event.target.value === "" ? null : Number(event.target.value);
    controller.setMaxDeliveryMinutes(value);
  });

  const retryButton = root.querySelector('[data-action="retry"]');
  if (retryButton) {
    retryButton.addEventListener("click", () => controller.retry());
  }

  const clearFiltersButton = root.querySelector('[data-action="clear-filters"]');
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => controller.clearFilters());
  }
}

controller.load();
