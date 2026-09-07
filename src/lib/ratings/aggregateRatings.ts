import type { Rating, RatingAggregate } from "../../types/rating.ts";

const EMPTY_AGGREGATE: RatingAggregate = { average: null, count: 0 };

function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function aggregateRatings(
  ratings: readonly Rating[] | null | undefined,
): RatingAggregate {
  if (!Array.isArray(ratings)) {
    return EMPTY_AGGREGATE;
  }

  let sum = 0;
  let count = 0;

  for (const rating of ratings) {
    const score = rating?.score;
    if (!isValidScore(score)) {
      continue;
    }
    sum += score;
    count += 1;
  }

  if (count === 0) {
    return EMPTY_AGGREGATE;
  }

  return { average: roundToOneDecimal(sum / count), count };
}
