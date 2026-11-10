import type { Episode, Season } from "./types";

/** Seasons longer than this wrap onto several rows of `WRAP_WIDTH` episodes. */
export const WRAP_THRESHOLD = 40;
export const WRAP_WIDTH = 25;

export type GridRow = {
  key: string;
  label: string;
  season: number;
  firstEpisode: number;
  /** Index `i` holds episode `firstEpisode + i`, or null when there is no such episode. */
  cells: (Episode | null)[];
  average: number | null;
};

export type HeatmapGrid = {
  columns: number;
  /** True when long seasons are split across rows; columns are then offsets, not episode numbers. */
  wrapped: boolean;
  rows: GridRow[];
};

export type SeasonAverage = { season: number; average: number };

export type ShowStats = {
  average: number | null;
  ratedEpisodes: number;
  totalEpisodes: number;
  best: Episode | null;
  worst: Episode | null;
  bestSeason: SeasonAverage | null;
  worstSeason: SeasonAverage | null;
};

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ratingsOf(episodes: Episode[]): number[] {
  return episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
}

export function seasonAverage(season: Season): number | null {
  return average(ratingsOf(season.episodes));
}

function lastEpisode(season: Season): number {
  return season.episodes.reduce((max, episode) => Math.max(max, episode.episode), 0);
}

export function buildGrid(seasons: Season[]): HeatmapGrid {
  const longest = seasons.reduce((max, season) => Math.max(max, lastEpisode(season)), 0);
  const wrapped = longest > WRAP_THRESHOLD;
  const columns = wrapped ? WRAP_WIDTH : longest;

  const rows: GridRow[] = [];
  for (const season of seasons) {
    const last = lastEpisode(season);
    const rowCount = Math.max(1, Math.ceil(last / Math.max(1, columns)));
    const buckets: Episode[][] = Array.from({ length: rowCount }, () => []);
    for (const episode of season.episodes) {
      buckets[Math.floor((episode.episode - 1) / Math.max(1, columns))].push(episode);
    }

    buckets.forEach((episodes, index) => {
      const firstEpisode = index * columns + 1;
      const cells: (Episode | null)[] = Array.from({ length: columns }, () => null);
      for (const episode of episodes) cells[episode.episode - firstEpisode] = episode;
      rows.push({
        key: `s${season.number}-${index}`,
        label:
          rowCount === 1
            ? `Season ${season.number}`
            : `S${season.number} · ${firstEpisode}–${Math.min(firstEpisode + columns - 1, last)}`,
        season: season.number,
        firstEpisode,
        cells,
        average: average(ratingsOf(episodes)),
      });
    });
  }

  return { columns, wrapped, rows };
}

/** Every episode in air order (season, then episode number). */
export function flattenEpisodes(seasons: Season[]): Episode[] {
  return [...seasons]
    .sort((a, b) => a.number - b.number)
    .flatMap((season) => [...season.episodes].sort((a, b) => a.episode - b.episode));
}

export function getShowStats(seasons: Season[]): ShowStats {
  const episodes = flattenEpisodes(seasons);
  const rated = episodes.filter((episode) => episode.rating !== null);

  let best: Episode | null = null;
  let worst: Episode | null = null;
  for (const episode of rated) {
    if (!best || episode.rating! > best.rating!) best = episode;
    if (!worst || episode.rating! < worst.rating!) worst = episode;
  }

  const seasonAverages = seasons.flatMap((season) => {
    const value = seasonAverage(season);
    return value === null ? [] : [{ season: season.number, average: value }];
  });
  let bestSeason: SeasonAverage | null = null;
  let worstSeason: SeasonAverage | null = null;
  for (const entry of seasonAverages) {
    if (!bestSeason || entry.average > bestSeason.average) bestSeason = entry;
    if (!worstSeason || entry.average < worstSeason.average) worstSeason = entry;
  }

  return {
    average: average(ratingsOf(rated)),
    ratedEpisodes: rated.length,
    totalEpisodes: episodes.length,
    best,
    worst,
    bestSeason,
    worstSeason: seasonAverages.length > 1 ? worstSeason : null,
  };
}

export function formatRating(rating: number | null): string {
  return rating === null ? "–" : rating.toFixed(1);
}

export function episodeCode(episode: Pick<Episode, "season" | "episode">): string {
  return `S${episode.season}E${episode.episode}`;
}

export function imdbTitleUrl(imdbID: string): string {
  return `https://www.imdb.com/title/${imdbID}/`;
}

export function formatVotes(votes: number | null): string | null {
  if (votes === null || votes <= 0) return null;
  return `${votes.toLocaleString("en-US")} ${votes === 1 ? "vote" : "votes"}`;
}
