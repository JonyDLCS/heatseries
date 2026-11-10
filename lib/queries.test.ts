import { createClient, type Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDataInfo, getSeries, getShowRatings, searchSeries } from "./queries";
import { INDEX_SQL, SCHEMA_SQL } from "./schema";
import { normalizeSearch } from "./text";

type SeriesRow = [id: number, title: string, votes: number, originalTitle?: string];

const SERIES: SeriesRow[] = [
  [903747, "Breaking Bad", 2_200_000],
  [388629, "One Piece", 300_000, "Wan pîsu"],
  [11737520, "One Piece", 150_000],
  [306414, "The Wire", 380_000],
  [1000001, "Wired Up", 900_000],
  [1000002, "Office Hours: The Wire", 5_000],
  [1000003, "100% Real", 10],
];

let db: Client;

beforeAll(async () => {
  db = createClient({ url: ":memory:" });
  await db.executeMultiple(SCHEMA_SQL + INDEX_SQL);
  await db.batch(
    SERIES.map(([id, title, votes, originalTitle]) => ({
      sql: `INSERT INTO series (id, type, title, original_title, search, search_original, start_year, end_year, genres, rating, votes)
            VALUES (?, 'tvSeries', ?, ?, ?, ?, 2008, 2013, 'Crime, Drama', 9.5, ?)`,
      args: [
        id,
        title,
        originalTitle ?? null,
        normalizeSearch(title),
        originalTitle ? normalizeSearch(originalTitle) : null,
        votes,
      ],
    })),
    "write",
  );
  await db.batch(
    [
      [903747, 2, 1, 1, "Seven Thirty-Seven", 8.6, 30000],
      [903747, 1, 2, 2, "Cat's in the Bag...", 8.6, 30000],
      [903747, 1, 1, 3, "Pilot", 9.0, 50000],
      [903747, 1, 3, 4, null, null, null],
    ].map(([seriesId, season, episode, id, title, rating, votes]) => ({
      sql: `INSERT INTO episodes (series_id, season, episode, id, title, year, rating, votes) VALUES (?, ?, ?, ?, ?, 2008, ?, ?)`,
      args: [seriesId, season, episode, id, title, rating, votes],
    })),
    "write",
  );
});

afterAll(() => db.close());

async function titles(query: string) {
  return (await searchSeries(db, query)).map((result) => `${result.title} ${result.imdbID}`);
}

describe("searchSeries", () => {
  it("ranks exact titles first, then by votes", async () => {
    expect(await titles("one piece")).toEqual(["One Piece tt0388629", "One Piece tt11737520"]);
  });

  it("treats a leading 'The' as optional for exact matches", async () => {
    expect(await titles("wire")).toEqual([
      "The Wire tt0306414",
      "Wired Up tt1000001",
      "Office Hours: The Wire tt1000002",
    ]);
  });

  it("puts prefix matches ahead of more popular substring matches", async () => {
    const results = await titles("wired");
    expect(results).toEqual(["Wired Up tt1000001"]);
    expect((await titles("bad"))[0]).toBe("Breaking Bad tt0903747");
  });

  it("matches the original title, ignoring accents", async () => {
    expect(await titles("wan pisu")).toEqual(["One Piece tt0388629"]);
  });

  it("treats LIKE wildcards literally", async () => {
    expect(await titles("%")).toEqual([]);
    expect(await titles("100")).toEqual(["100% Real tt1000003"]);
  });

  it("ignores queries that are too short", async () => {
    expect(await titles("o")).toEqual([]);
  });

  it("returns display fields", async () => {
    const [result] = await searchSeries(db, "breaking bad");
    expect(result).toEqual({
      imdbID: "tt0903747",
      title: "Breaking Bad",
      year: "2008–2013",
      rating: 9.5,
      votes: 2_200_000,
    });
  });
});

describe("getSeries", () => {
  it("returns the series with its season count", async () => {
    const series = await getSeries(db, "tt0903747");
    expect(series).toMatchObject({ title: "Breaking Bad", genre: "Crime, Drama", totalSeasons: 2 });
    expect(series?.originalTitle).toBeNull();
  });

  it("returns null for unknown or invalid IDs", async () => {
    expect(await getSeries(db, "tt9999999")).toBeNull();
    expect(await getSeries(db, "nonsense")).toBeNull();
  });
});

describe("getDataInfo", () => {
  it("returns null before the import has written its metadata", async () => {
    expect(await getDataInfo(db)).toBeNull();
  });

  it("reads the build time and counts", async () => {
    await db.batch(
      [
        { sql: "INSERT INTO meta (key, value) VALUES ('built_at', ?)", args: ["2026-11-10T01:15:19.111Z"] },
        { sql: "INSERT INTO meta (key, value) VALUES ('series', '46877')", args: [] },
        { sql: "INSERT INTO meta (key, value) VALUES ('episodes', '933722')", args: [] },
      ],
      "write",
    );
    expect(await getDataInfo(db)).toEqual({
      builtAt: "2026-11-10T01:15:19.111Z",
      series: 46877,
      episodes: 933722,
    });
  });
});

describe("getShowRatings", () => {
  it("groups episodes into ordered seasons", async () => {
    const show = await getShowRatings(db, "tt0903747");
    expect(show?.seasons.map((season) => season.number)).toEqual([1, 2]);
    expect(show?.seasons[0].episodes.map((episode) => episode.title)).toEqual([
      "Pilot",
      "Cat's in the Bag...",
      "Episode 3",
    ]);
    expect(show?.seasons[0].episodes[2]).toMatchObject({ rating: null, votes: null, imdbID: "tt0000004" });
    expect(show?.seasons[1].episodes[0]).toMatchObject({ season: 2, episode: 1, rating: 8.6, year: 2008 });
  });

  it("returns null for a show that isn't in the database", async () => {
    expect(await getShowRatings(db, "tt9999999")).toBeNull();
  });
});
