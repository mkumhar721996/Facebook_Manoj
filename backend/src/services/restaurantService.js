export function listRestaurants(restaurants, filters = {}) {
  const { search, cuisine, minRating, maxDeliveryMinutes } = filters;

  return restaurants.filter((restaurant) => {
    if (search) {
      const term = search.toLowerCase();
      const matchesSearch =
        restaurant.name.toLowerCase().includes(term) ||
        restaurant.cuisineType.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    if (cuisine && restaurant.cuisineType.toLowerCase() !== cuisine.toLowerCase()) {
      return false;
    }

    if (minRating !== undefined && minRating !== null) {
      if (restaurant.averageRating === null || restaurant.averageRating < minRating) {
        return false;
      }
    }

    if (maxDeliveryMinutes !== undefined && maxDeliveryMinutes !== null) {
      if (restaurant.estimatedDeliveryMinutes > maxDeliveryMinutes) {
        return false;
      }
    }

    return true;
  });
}
