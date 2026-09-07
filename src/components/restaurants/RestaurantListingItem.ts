import type { Restaurant } from "../../types/restaurant.ts";
import { aggregateRatings } from "../../lib/ratings/aggregateRatings.ts";
import { RatingSummary } from "../ratings/RatingSummary.ts";
import { h, type VNode } from "../../lib/dom/vnode.ts";

export function RestaurantListingItem(restaurant: Restaurant): VNode {
  const aggregate = aggregateRatings(restaurant.ratings);

  return h("li", { class: "restaurant-listing-item" }, [
    h("span", { class: "restaurant-listing-item__name" }, [restaurant.name]),
    RatingSummary(aggregate),
  ]);
}
