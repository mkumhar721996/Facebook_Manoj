import type { Restaurant } from "../types/restaurant.ts";

const CLOSED_LABELS: Record<"closed" | "paused", string> = {
  closed: "Closed",
  paused: "Temporarily unavailable",
};

function isUnavailable(
  status: Restaurant["status"]
): status is "closed" | "paused" {
  return status === "closed" || status === "paused";
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function renderRestaurantCard(restaurant: Restaurant): string {
  const unavailable = isUnavailable(restaurant.status);
  const cardClass = unavailable
    ? "restaurant-card restaurant-card--closed"
    : "restaurant-card restaurant-card--open";

  const badge = unavailable
    ? `<span class="restaurant-card__badge restaurant-card__badge--closed">${CLOSED_LABELS[restaurant.status]}</span>`
    : "";

  const orderAction = unavailable
    ? ""
    : `<button class="restaurant-card__order-button">Order now</button>`;

  return (
    `<article class="${cardClass}" data-status="${restaurant.status}">` +
    `<h3 class="restaurant-card__name">${escapeHtml(restaurant.name)}</h3>` +
    `<p class="restaurant-card__cuisine">${escapeHtml(restaurant.cuisine)}</p>` +
    badge +
    orderAction +
    `</article>`
  );
}
