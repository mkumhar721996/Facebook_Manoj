import type { Restaurant } from "../types/restaurant.ts";

export interface RestaurantFilterCriteria {
  cuisine?: string;
  name?: string;
}

export function filterRestaurants(
  restaurants: Restaurant[],
  criteria: RestaurantFilterCriteria
): Restaurant[] {
  return restaurants.filter((restaurant) => {
    if (criteria.cuisine && restaurant.cuisine !== criteria.cuisine) {
      return false;
    }
    if (
      criteria.name &&
      !restaurant.name.toLowerCase().includes(criteria.name.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}
