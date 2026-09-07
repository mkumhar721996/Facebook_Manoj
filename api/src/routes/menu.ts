import type { MenuItem } from "../data/menuStore.ts";

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
  } catch {
    return { status: 500, body: { error: "Failed to load menu" } };
  }

  if (!items) {
    return { status: 404, body: { error: "Restaurant not found" } };
  }

  return { status: 200, body: { items } };
}
