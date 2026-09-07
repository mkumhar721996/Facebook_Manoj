export interface CustomisationOption {
  name: string;
  choices: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  customisationOptions: CustomisationOption[];
}

const menusByRestaurantId: Record<string, MenuItem[]> = {
  "open-burger-shack": [
    {
      id: "classic-cheeseburger",
      name: "Classic Cheeseburger",
      description: "Beef patty, cheddar, lettuce, tomato, and house sauce on a toasted bun.",
      price: 8.99,
      customisationOptions: [
        { name: "Bun type", choices: ["Sesame", "Brioche", "Gluten-free"] },
        { name: "Toppings", choices: ["Pickles", "Onions", "Bacon"] },
      ],
    },
    {
      id: "veggie-burger",
      name: "Veggie Burger",
      description: "Grilled plant-based patty with avocado and chipotle mayo.",
      price: 9.49,
      customisationOptions: [
        { name: "Bun type", choices: ["Sesame", "Brioche", "Gluten-free"] },
        { name: "Spice level", choices: ["Mild", "Medium", "Hot"] },
      ],
    },
  ],
};

export function getMenu(restaurantId: string): MenuItem[] | undefined {
  return menusByRestaurantId[restaurantId];
}
