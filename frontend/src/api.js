export async function fetchRestaurants(filters, { fetchImpl = fetch, baseUrl = "" } = {}) {
  const url = new URL("/api/restaurants", baseUrl || window.location.origin);

  if (filters.search) url.searchParams.set("search", filters.search);
  if (filters.cuisine) url.searchParams.set("cuisine", filters.cuisine);
  if (filters.minRating !== null && filters.minRating !== undefined) {
    url.searchParams.set("minRating", String(filters.minRating));
  }
  if (filters.maxDeliveryMinutes !== null && filters.maxDeliveryMinutes !== undefined) {
    url.searchParams.set("maxDeliveryMinutes", String(filters.maxDeliveryMinutes));
  }

  const response = await fetchImpl(url.toString(), { headers: {} });

  if (!response.ok) {
    throw new Error("Failed to fetch restaurants");
  }

  const body = await response.json();
  return body.restaurants;
}
