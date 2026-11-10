import { describe, expect, it } from "vitest";

import { bucketRangeLabel, getRatingBucket, RATING_BUCKETS, UNRATED_BUCKET } from "./colors";

describe("getRatingBucket", () => {
  it.each([
    [9.5, "Excellent"],
    [9, "Excellent"],
    [8.99, "Great"],
    [8, "Great"],
    [7.5, "Good"],
    [6, "Mediocre"],
    [5.9, "Bad"],
    [1, "Bad"],
  ])("maps %s to %s", (rating, label) => {
    expect(getRatingBucket(rating).label).toBe(label);
  });

  it("uses the unrated bucket for missing scores", () => {
    expect(getRatingBucket(null)).toBe(UNRATED_BUCKET);
    expect(getRatingBucket(Number.NaN)).toBe(UNRATED_BUCKET);
  });
});

describe("bucketRangeLabel", () => {
  it("describes each bucket's range", () => {
    expect(RATING_BUCKETS.map(bucketRangeLabel)).toEqual(["9+", "8–9", "7–8", "6–7", "< 6"]);
    expect(bucketRangeLabel(UNRATED_BUCKET)).toBe("");
  });
});
