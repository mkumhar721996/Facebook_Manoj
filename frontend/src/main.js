import { createController } from "./controller.js";
import { FIELD_BINDINGS } from "./fieldBindings.js";

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
  for (const binding of FIELD_BINDINGS) {
    const element = root.querySelector(`[data-testid="${binding.testId}"]`);
    element.addEventListener(binding.event, (event) => {
      controller[binding.action](binding.parse(event.target.value));
    });
  }

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
