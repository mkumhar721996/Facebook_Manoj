import type { MenuItem } from "../../types/menuItem.ts";
import { aggregateRatings } from "../../lib/ratings/aggregateRatings.ts";
import { RatingSummary } from "../ratings/RatingSummary.ts";
import { h, type VNode } from "../../lib/dom/vnode.ts";

export function MenuItemCard(menuItem: MenuItem): VNode {
  const aggregate = aggregateRatings(menuItem.ratings);

  return h("li", { class: "menu-item-card" }, [
    h("span", { class: "menu-item-card__name" }, [menuItem.name]),
    h("span", { class: "menu-item-card__price" }, [String(menuItem.price)]),
    RatingSummary(aggregate),
  ]);
}
