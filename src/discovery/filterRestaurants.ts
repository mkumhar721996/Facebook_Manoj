import type { Restaurant } from "../types/restaurant.ts";

export interface RestaurantFilterCriteria {
  cuisine?: string;
  name?: string;
}

export function filterRestaurants(
  restaurants: Restaurant[],
  criteria: RestaurantFilterCriteria
): Restaurant[] {
  const lowerCaseName = criteria.name?.toLowerCase();

  return restaurants.filter((restaurant) => {
    if (criteria.cuisine && restaurant.cuisine !== criteria.cuisine) {
      return false;
    }
    if (
      lowerCaseName &&
      !restaurant.name.toLowerCase().includes(lowerCaseName)
    ) {
      return false;
    }
    return true;
  });
}
