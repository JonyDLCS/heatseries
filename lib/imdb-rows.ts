/** Rules for turning rows of IMDb's dataset files into database rows. */

export const NULL_FIELD = "\\N";

export const KEPT_SERIES_TYPES = new Set(["tvSeries", "tvMiniSeries"]);

/** "tt0388629" -> 388629. Returns null for anything that isn't a title ID. */
export function parseTconst(value: string): number | null {
  if (!value.startsWith("tt")) return null;
  const id = Number(value.slice(2));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** 388629 -> "tt0388629". IMDb pads title IDs to at least 7 digits. */
export function formatTconst(id: number): string {
  return `tt${String(id).padStart(7, "0")}`;
}

export function parseOptionalInt(value: string | undefined): number | null {
  if (value === undefined || value === NULL_FIELD || value === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function parseOptionalText(value: string | undefined): string | null {
  return value === undefined || value === NULL_FIELD || value === "" ? null : value;
}

/** Episodes need a season and episode number to have a cell in the grid. */
export function parseSlot(
  season: string | undefined,
  episode: string | undefined,
): { season: number; episode: number } | null {
  const s = parseOptionalInt(season);
  const e = parseOptionalInt(episode);
  return s !== null && e !== null && s >= 1 && e >= 1 ? { season: s, episode: e } : null;
}

/**
 * Unrated episodes are only worth storing for shows that are mostly rated;
 * otherwise long-running soaps and talk shows add thousands of gray cells.
 */
export function keepsUnratedEpisodes(rated: number, unrated: number): boolean {
  return rated >= 1 && rated >= unrated;
}

export function isKeptSeries(titleType: string, isAdult: string): boolean {
  return KEPT_SERIES_TYPES.has(titleType) && isAdult !== "1";
}

const PLACEHOLDER_TITLE = /^(episode\s*#?\s*[\d.]+|episode dated .+)$/i;

/** IMDb fills unnamed episodes with titles like "Episode #1.5"; treat those as untitled. */
export function cleanEpisodeTitle(title: string | null): string | null {
  if (title === null) return null;
  const trimmed = title.trim();
  return trimmed === "" || PLACEHOLDER_TITLE.test(trimmed) ? null : trimmed;
}

/** When two episodes claim the same season/episode slot, the one with more votes wins. */
export function prefersCandidate(currentVotes: number, candidateVotes: number): boolean {
  return candidateVotes > currentVotes;
}

/** IMDb stores ratings to one decimal; keeping them as tenths avoids float noise. */
export function parseRatingTenths(value: string | undefined): number | null {
  const rating = Number(value);
  return Number.isFinite(rating) && rating > 0 ? Math.round(rating * 10) : null;
}
