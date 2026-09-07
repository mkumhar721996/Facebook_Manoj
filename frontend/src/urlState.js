export function parseFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  const minRatingParam = params.get("minRating");
  const maxDeliveryParam = params.get("maxDeliveryMinutes");

  return {
    search: params.get("search") || "",
    cuisine: params.get("cuisine") || "",
    minRating: minRatingParam !== null ? Number(minRatingParam) : null,
    maxDeliveryMinutes: maxDeliveryParam !== null ? Number(maxDeliveryParam) : null,
  };
}

export function buildSearchString(filters) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.cuisine) params.set("cuisine", filters.cuisine);
  if (filters.minRating !== null && filters.minRating !== undefined) {
    params.set("minRating", String(filters.minRating));
  }
  if (filters.maxDeliveryMinutes !== null && filters.maxDeliveryMinutes !== undefined) {
    params.set("maxDeliveryMinutes", String(filters.maxDeliveryMinutes));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
