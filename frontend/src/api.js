export async function fetchRestaurants(
  filters,
  { fetchImpl = fetch, baseUrl = "", logger = console } = {}
) {
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
    let body;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    logger.error({ event: "restaurant_fetch_failed", status: response.status, body });
    throw new Error("Failed to fetch restaurants");
  }

  const body = await response.json();
  return body.restaurants;
}
