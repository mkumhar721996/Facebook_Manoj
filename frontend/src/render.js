function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRestaurantCard(restaurant) {
  const rating =
    restaurant.averageRating === null || restaurant.averageRating === undefined
      ? "No ratings yet"
      : restaurant.averageRating;

  return `
    <li class="restaurant-card" data-testid="restaurant-card">
      <h3>${escapeHtml(restaurant.name)}</h3>
      <p class="cuisine-type">${escapeHtml(restaurant.cuisineType)}</p>
      <p class="rating">${escapeHtml(rating)}</p>
      <p class="delivery-time">${escapeHtml(restaurant.estimatedDeliveryMinutes)} min</p>
    </li>
  `;
}

function renderSearchBar(state) {
  return `
    <label for="search-input">Search</label>
    <input
      type="text"
      id="search-input"
      data-testid="search-input"
      placeholder="Search by name or cuisine"
      value="${escapeHtml(state.search)}"
    />
  `;
}

function renderFilterPanel(state) {
  return `
    <div data-testid="filter-panel">
      <label for="cuisine-filter">Cuisine</label>
      <input type="text" id="cuisine-filter" data-testid="cuisine-filter" placeholder="Cuisine" value="${escapeHtml(
        state.cuisine
      )}" />
      <label for="min-rating-filter">Minimum rating</label>
      <input type="number" id="min-rating-filter" data-testid="min-rating-filter" placeholder="Minimum rating" value="${
        state.minRating ?? ""
      }" />
      <label for="max-delivery-filter">Max delivery minutes</label>
      <input type="number" id="max-delivery-filter" data-testid="max-delivery-filter" placeholder="Max delivery minutes" value="${
        state.maxDeliveryMinutes ?? ""
      }" />
    </div>
  `;
}

function renderLoadingIndicator() {
  return `<div data-testid="loading-indicator" role="status" aria-live="polite">Loading restaurants...</div>`;
}

function renderErrorState() {
  return `
    <div data-testid="error-state" role="alert" aria-live="assertive">
      <p>Something went wrong. Please try again.</p>
      <button type="button" data-action="retry">Retry</button>
    </div>
  `;
}

function renderEmptyState() {
  return `
    <div data-testid="empty-state" role="status" aria-live="polite">
      <p>No results found</p>
      <button type="button" data-action="clear-filters">Clear filters</button>
    </div>
  `;
}

function renderResultsAnnouncement(count) {
  const message = count === 1 ? "Found 1 restaurant" : `Found ${count} restaurants`;
  return `<div data-testid="results-announcement" role="status" aria-live="polite">${message}</div>`;
}

function renderRestaurantList(restaurants) {
  return `
    ${renderResultsAnnouncement(restaurants.length)}
    <ul data-testid="restaurant-list">
      ${restaurants.map(renderRestaurantCard).join("")}
    </ul>
  `;
}

function renderResults(state) {
  if (state.status === "error") {
    return renderErrorState();
  }
  if (state.status === "loading") {
    return renderLoadingIndicator();
  }
  if (state.status === "success" && state.restaurants.length === 0) {
    return renderEmptyState();
  }
  if (state.status === "success") {
    return renderRestaurantList(state.restaurants);
  }
  return "";
}

export function renderApp(state) {
  return `
    ${renderSearchBar(state)}
    ${renderFilterPanel(state)}
    ${renderResults(state)}
  `;
}
