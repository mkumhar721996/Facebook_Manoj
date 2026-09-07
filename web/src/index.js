import { getMenu } from "./api/menuClient.js";
import { MenuPageController, renderMenuPage, RETRY_ACTION_ID } from "./pages/MenuPage.js";

const API_BASE_URL = window.__API_BASE_URL__ ?? "http://localhost:8010";

function getRestaurantIdFromLocation() {
  return new URLSearchParams(window.location.search).get("restaurantId") ?? "open-burger-shack";
}

function mountMenuPage(container, restaurantId) {
  const client = { getMenu: (id) => getMenu(id, API_BASE_URL) };
  const controller = new MenuPageController(client, restaurantId);

  controller.subscribe((state) => {
    container.innerHTML = renderMenuPage(state);
  });

  container.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.actionId === RETRY_ACTION_ID) {
      controller.retry();
    }
  });

  controller.load();
}

const container = document.getElementById("app");
if (container) {
  mountMenuPage(container, getRestaurantIdFromLocation());
}
