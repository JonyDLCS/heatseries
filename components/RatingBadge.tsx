import { getRatingBucket } from "@/lib/colors";
import { formatRating } from "@/lib/ratings";

export function RatingBadge({ rating, className = "" }: { rating: number | null; className?: string }) {
  const bucket = getRatingBucket(rating);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-semibold tabular-nums ${bucket.className} ${className}`}
    >
      {formatRating(rating)}
    </span>
  );
}
