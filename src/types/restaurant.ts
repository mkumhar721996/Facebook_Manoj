export type RestaurantAvailabilityStatus = "open" | "closed" | "paused";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  status: RestaurantAvailabilityStatus;
}
