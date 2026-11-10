export type RatingBucket = {
  label: string;
  /** Inclusive lower bound of the bucket. */
  min: number;
  className: string;
  hex: string;
};

/** Ordered from best to worst; the first bucket whose `min` a score reaches wins. */
export const RATING_BUCKETS: RatingBucket[] = [
  { label: "Excellent", min: 9, className: "bg-emerald-700 text-white", hex: "#047857" },
  { label: "Great", min: 8, className: "bg-green-500 text-green-950", hex: "#22c55e" },
  { label: "Good", min: 7, className: "bg-lime-300 text-lime-950", hex: "#bef264" },
  { label: "Mediocre", min: 6, className: "bg-amber-300 text-amber-950", hex: "#fcd34d" },
  { label: "Bad", min: 0, className: "bg-red-600 text-white", hex: "#dc2626" },
];

export const UNRATED_BUCKET: RatingBucket = {
  label: "No score",
  min: Number.NaN,
  className: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  hex: "#a1a1aa",
};

export function getRatingBucket(rating: number | null): RatingBucket {
  if (rating === null || !Number.isFinite(rating)) return UNRATED_BUCKET;
  return RATING_BUCKETS.find((bucket) => rating >= bucket.min) ?? UNRATED_BUCKET;
}

export function bucketRangeLabel(bucket: RatingBucket): string {
  const index = RATING_BUCKETS.indexOf(bucket);
  if (index === -1) return "";
  if (index === 0) return `${bucket.min}+`;
  const upper = RATING_BUCKETS[index - 1].min;
  return bucket.min === 0 ? `< ${upper}` : `${bucket.min}–${upper}`;
}
