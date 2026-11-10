import { bucketRangeLabel, RATING_BUCKETS, UNRATED_BUCKET } from "@/lib/colors";

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Color legend">
      {RATING_BUCKETS.map((bucket) => (
        <li key={bucket.label} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded-sm ${bucket.className}`} aria-hidden />
          <span>{bucket.label}</span>
          <span className="text-zinc-500">{bucketRangeLabel(bucket)}</span>
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className={`h-3.5 w-3.5 rounded-sm ${UNRATED_BUCKET.className}`} aria-hidden />
        <span>{UNRATED_BUCKET.label}</span>
      </li>
    </ul>
  );
}
