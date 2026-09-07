import type { Rating } from "./rating.ts";

export type Restaurant = {
  name: string;
  ratings?: readonly Rating[];
};
