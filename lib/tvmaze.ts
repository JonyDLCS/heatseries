import "server-only";

import { cacheLife } from "next/cache";

import { toShowDetails, type TvmazeShow } from "./tvmaze-parse";
import type { ShowDetails } from "./types";

/**
 * Looks a show up on TVmaze by IMDb ID. Returns null when TVmaze has no match
 * (cached like any result); throws on network or server errors so those are
 * not cached.
 */
export async function getShowDetails(imdbID: string): Promise<ShowDetails | null> {
  "use cache";
  cacheLife("weeks");

  const response = await fetch(
    `https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdbID)}`,
    { signal: AbortSignal.timeout(5_000) },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TVmaze responded with HTTP ${response.status}`);
  return toShowDetails((await response.json()) as TvmazeShow);
}
