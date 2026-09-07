import { logError as defaultLogError } from "../observability/logger.js";
import { incrementCounter as defaultIncrementCounter } from "../observability/metrics.js";

/**
 * @typedef {import("../api/menuClient.js").MenuItem} MenuItem
 * @typedef {import("../api/menuClient.js").CustomisationOption} CustomisationOption
 * @typedef {{ status: "loading" }} LoadingState
 * @typedef {{ status: "error" }} ErrorState
 * @typedef {{ status: "success", items: MenuItem[] }} SuccessState
 * @typedef {LoadingState | ErrorState | SuccessState} MenuPageState
 * @typedef {{ getMenu(restaurantId: string): Promise<MenuItem[]> }} MenuClient
 * @typedef {{ logError?: typeof defaultLogError, incrementCounter?: typeof defaultIncrementCounter }} MenuPageDependencies
 */

export const GENERIC_ERROR_MESSAGE = "Something went wrong loading the menu. Please try again.";

export const RETRY_ACTION_ID = "retry-menu-load";

export class MenuPageController {
  /**
   * @param {MenuClient} client
   * @param {string} restaurantId
   * @param {MenuPageDependencies} [dependencies]
   */
  constructor(client, restaurantId, dependencies = {}) {
    this.client = client;
    this.restaurantId = restaurantId;
    this.logError = dependencies.logError ?? defaultLogError;
    this.incrementCounter = dependencies.incrementCounter ?? defaultIncrementCounter;
    /** @type {MenuPageState} */
    this.state = { status: "loading" };
    /** @type {Array<(state: MenuPageState) => void>} */
    this.listeners = [];
  }

  /**
   * @param {(state: MenuPageState) => void} listener
   */
  subscribe(listener) {
    this.listeners.push(listener);
  }

  /**
   * @param {MenuPageState} state
   */
  setState(state) {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  async load() {
    this.setState({ status: "loading" });
    try {
      const items = await this.client.getMenu(this.restaurantId);
      this.setState({ status: "success", items });
    } catch (error) {
      this.logError("Failed to load menu from API", {
        restaurantId: this.restaurantId,
        error: error instanceof Error ? error.message : String(error),
      });
      this.incrementCounter("menu_load_failures_total");
      this.setState({ status: "error" });
    }
  }

  retry() {
    return this.load();
  }
}

/**
 * @param {MenuPageState} state
 * @returns {string}
 */
export function renderMenuPage(state) {
  if (state.status === "loading") {
    return `<h1>Menu</h1><div role="status" data-testid="menu-loading">Loading menu…</div>`;
  }

  if (state.status === "error") {
    return `<h1>Menu</h1><div role="alert" data-testid="menu-error">
      <p>${GENERIC_ERROR_MESSAGE}</p>
      <button type="button" data-testid="menu-retry" data-action-id="${RETRY_ACTION_ID}">Retry</button>
    </div>`;
  }

  return `<h1>Menu</h1><ul data-testid="menu-items">${state.items.map(renderMenuItem).join("")}</ul>`;
}

/**
 * @param {MenuItem} item
 * @returns {string}
 */
function renderMenuItem(item) {
  return `<li data-testid="menu-item" data-item-id="${escapeHtml(item.id)}">
    <h2>${escapeHtml(item.name)}</h2>
    <p>${escapeHtml(item.description)}</p>
    <span data-testid="menu-item-price">$${item.price.toFixed(2)}</span>
    <ul data-testid="menu-item-customisations">${item.customisationOptions
      .map(renderCustomisationOption)
      .join("")}</ul>
  </li>`;
}

/**
 * @param {CustomisationOption} option
 * @returns {string}
 */
function renderCustomisationOption(option) {
  return `<li><strong>${escapeHtml(option.name)}</strong>: ${option.choices.map(escapeHtml).join(", ")}</li>`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
