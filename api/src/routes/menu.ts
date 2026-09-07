import type { MenuItem } from "../data/menuStore.ts";
import { logError } from "../observability/logger.ts";
import { incrementCounter } from "../observability/metrics.ts";

export interface MenuStore {
  getMenu(restaurantId: string): MenuItem[] | undefined;
}

export interface MenuResponse {
  status: number;
  body: { items: MenuItem[] } | { error: string };
}

export function getMenuResponse(store: MenuStore, restaurantId: string): MenuResponse {
  let items: MenuItem[] | undefined;
  try {
    items = store.getMenu(restaurantId);
  } catch (error) {
    logError("Failed to load menu from data store", {
      restaurantId,
      error: error instanceof Error ? error.message : String(error),
    });
    incrementCounter("menu_fetch_failures_total", { restaurantId });
    return { status: 500, body: { error: "Failed to load menu" } };
  }

  if (!items) {
    return { status: 404, body: { error: "Restaurant not found" } };
  }

  return { status: 200, body: { items } };
}
