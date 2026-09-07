import type { RatingAggregate } from "../../types/rating.ts";
import { h, type VNode } from "../../lib/dom/vnode.ts";

export function RatingSummary(aggregate: RatingAggregate): VNode {
  if (aggregate.count === 0 || aggregate.average === null) {
    return h("span", { class: "rating-summary rating-summary--empty" }, ["No ratings yet"]);
  }

  const reviewWord = aggregate.count === 1 ? "review" : "reviews";
  const countText = aggregate.count.toLocaleString("en-US", { useGrouping: false });

  return h("span", { class: "rating-summary" }, [
    h("span", { class: "rating-summary__average" }, [String(aggregate.average)]),
    " (",
    `${countText} ${reviewWord}`,
    ")",
  ]);
}
