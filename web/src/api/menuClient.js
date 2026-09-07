/**
 * @typedef {{ name: string, choices: string[] }} CustomisationOption
 * @typedef {{ id: string, name: string, description: string, price: number, customisationOptions: CustomisationOption[] }} MenuItem
 */

/**
 * Fetches the menu for a restaurant from the API.
 * @param {string} restaurantId
 * @param {string} [baseUrl]
 * @param {string} [traceId]
 * @returns {Promise<MenuItem[]>}
 */
export async function getMenu(restaurantId, baseUrl = "", traceId) {
  const headers = traceId ? { "X-Trace-ID": traceId } : undefined;
  const response = await fetch(`${baseUrl}/restaurants/${encodeURIComponent(restaurantId)}/menu`, { headers });

  if (!response.ok) {
    throw new Error(`Failed to load menu: ${response.status}`);
  }

  const body = await response.json();
  return body.items;
}
