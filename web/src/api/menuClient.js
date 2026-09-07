/**
 * @typedef {{ name: string, choices: string[] }} CustomisationOption
 * @typedef {{ id: string, name: string, description: string, price: number, customisationOptions: CustomisationOption[] }} MenuItem
 */

/**
 * Fetches the menu for a restaurant from the API.
 * @param {string} restaurantId
 * @param {string} [baseUrl]
 * @returns {Promise<MenuItem[]>}
 */
export async function getMenu(restaurantId, baseUrl = "") {
  const response = await fetch(`${baseUrl}/restaurants/${encodeURIComponent(restaurantId)}/menu`);

  if (!response.ok) {
    throw new Error(`Failed to load menu: ${response.status}`);
  }

  const body = await response.json();
  return body.items;
}
