import type { Rating } from "./rating.ts";

export type MenuItem = {
  name: string;
  price: number;
  ratings?: readonly Rating[];
};
