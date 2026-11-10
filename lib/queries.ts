import type { Client, Row } from "@libsql/client";

import { formatTconst, parseTconst } from "./imdb-rows";
import { formatYears, normalizeSearch } from "./text";
import type { Episode, SearchResult, Season, Series, ShowRatings } from "./types";

export const MIN_QUERY_LENGTH = 2;

const IMDB_ID = /^tt\d{7,9}$/;

export function isImdbId(value: string): boolean {
  return IMDB_ID.test(value);
}

function num(value: Row[string]): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function str(value: Row[string]): string | null {
  return value === null || value === undefined ? null : String(value);
}

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Matches the English and original titles, accent-insensitively. Exact titles
 * rank first (ignoring a leading "The"), then titles starting with the query,
 * then everything else; ties go to the show with more votes.
 */
export async function searchSeries(db: Client, query: string, limit = 10): Promise<SearchResult[]> {
  const q = normalizeSearch(query);
  if (q.length < MIN_QUERY_LENGTH) return [];
  const like = escapeLike(q);

  const result = await db.execute({
    sql: `
      SELECT id, type, title, start_year, end_year, rating, votes
      FROM series
      WHERE search LIKE :contains ESCAPE '\\' OR search_original LIKE :contains ESCAPE '\\'
      ORDER BY
        (search = :exact OR search = :exactThe OR search_original = :exact) DESC,
        (search LIKE :prefix ESCAPE '\\' OR search LIKE :prefixThe ESCAPE '\\'
          OR search_original LIKE :prefix ESCAPE '\\') DESC,
        votes DESC
      LIMIT :limit`,
    args: {
      contains: `%${like}%`,
      exact: q,
      exactThe: `the ${q}`,
      prefix: `${like}%`,
      prefixThe: `the ${like}%`,
      limit,
    },
  });

  return result.rows.map((row) => ({
    imdbID: formatTconst(num(row.id)!),
    title: str(row.title) ?? "",
    year: formatYears(num(row.start_year), num(row.end_year), str(row.type)),
    rating: num(row.rating),
    votes: num(row.votes) ?? 0,
  }));
}

export async function getSeries(db: Client, imdbID: string): Promise<Series | null> {
  if (!isImdbId(imdbID)) return null;
  const id = parseTconst(imdbID);
  if (id === null) return null;

  const result = await db.execute({
    sql: `
      SELECT s.*, (SELECT COUNT(DISTINCT season) FROM episodes WHERE series_id = s.id) AS seasons
      FROM series s
      WHERE s.id = ?`,
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;

  return {
    imdbID: formatTconst(id),
    type: str(row.type) ?? "tvSeries",
    title: str(row.title) ?? "",
    originalTitle: str(row.original_title),
    year: formatYears(num(row.start_year), num(row.end_year), str(row.type)),
    genre: str(row.genres),
    rating: num(row.rating),
    votes: num(row.votes) ?? 0,
    totalSeasons: num(row.seasons) ?? 0,
  };
}

export async function getShowRatings(db: Client, imdbID: string): Promise<ShowRatings | null> {
  const series = await getSeries(db, imdbID);
  if (!series) return null;

  const result = await db.execute({
    sql: `
      SELECT season, episode, id, title, year, rating, votes
      FROM episodes
      WHERE series_id = ?
      ORDER BY season, episode`,
    args: [parseTconst(imdbID)!],
  });

  const seasons: Season[] = [];
  for (const row of result.rows) {
    const number = num(row.season)!;
    const episodeNumber = num(row.episode)!;
    const episode: Episode = {
      imdbID: formatTconst(num(row.id)!),
      season: number,
      episode: episodeNumber,
      title: str(row.title) ?? `Episode ${episodeNumber}`,
      year: num(row.year),
      rating: num(row.rating),
      votes: num(row.votes),
    };
    const last = seasons.at(-1);
    if (last?.number === number) last.episodes.push(episode);
    else seasons.push({ number, episodes: [episode] });
  }

  return { series, seasons };
}
