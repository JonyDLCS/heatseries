import { describe, expect, it } from "vitest";

import {
  average,
  buildGrid,
  episodeCode,
  flattenEpisodes,
  formatRating,
  formatVotes,
  getShowStats,
  WRAP_WIDTH,
} from "./ratings";
import type { Episode, Season } from "./types";

function ep(season: number, episode: number, rating: number | null, title = `Episode ${episode}`): Episode {
  return {
    imdbID: `tt${String(season * 1000 + episode).padStart(7, "0")}`,
    season,
    episode,
    title,
    year: 2020,
    rating,
    votes: rating === null ? null : 100,
  };
}

const seasons: Season[] = [
  { number: 1, episodes: [ep(1, 1, 8.1, "Pilot"), ep(1, 2, 7.4), ep(1, 4, 9.3, "Finale")] },
  { number: 2, episodes: [ep(2, 1, 6.5, "Return"), ep(2, 2, null)] },
];

function longSeason(number: number, count: number): Season {
  return { number, episodes: Array.from({ length: count }, (_, i) => ep(number, i + 1, 5 + (i % 5))) };
}

describe("buildGrid", () => {
  const grid = buildGrid(seasons);

  it("sizes columns by the longest season and leaves gaps empty", () => {
    expect(grid.wrapped).toBe(false);
    expect(grid.columns).toBe(4);
    expect(grid.rows[0].cells.map((cell) => cell?.episode ?? null)).toEqual([1, 2, null, 4]);
    expect(grid.rows[1].cells.map((cell) => cell?.episode ?? null)).toEqual([1, 2, null, null]);
    expect(grid.rows.map((row) => row.label)).toEqual(["Season 1", "Season 2"]);
  });

  it("averages only rated episodes", () => {
    expect(grid.rows[0].average).toBeCloseTo((8.1 + 7.4 + 9.3) / 3);
    expect(grid.rows[1].average).toBe(6.5);
  });

  it("handles a show with no seasons", () => {
    expect(buildGrid([])).toEqual({ columns: 0, wrapped: false, rows: [] });
  });

  it("keeps a 40-episode season on one row", () => {
    const flat = buildGrid([longSeason(1, 40)]);
    expect(flat.wrapped).toBe(false);
    expect(flat.rows).toHaveLength(1);
    expect(flat.columns).toBe(40);
  });

  it("wraps long seasons into rows of 25 with their own averages", () => {
    const wrapped = buildGrid([longSeason(1, 60), { number: 2, episodes: [ep(2, 1, 9), ep(2, 3, 7)] }]);
    expect(wrapped.wrapped).toBe(true);
    expect(wrapped.columns).toBe(WRAP_WIDTH);
    expect(wrapped.rows.map((row) => row.label)).toEqual([
      "S1 · 1–25",
      "S1 · 26–50",
      "S1 · 51–60",
      "Season 2",
    ]);

    const last = wrapped.rows[2];
    expect(last.firstEpisode).toBe(51);
    expect(last.cells[0]?.episode).toBe(51);
    expect(last.cells[9]?.episode).toBe(60);
    expect(last.cells[10]).toBeNull();
    expect(last.average).toBeCloseTo(average(last.cells.flatMap((c) => (c?.rating ? [c.rating] : [])))!);

    expect(wrapped.rows[3].cells.map((cell) => cell?.episode ?? null).slice(0, 4)).toEqual([1, null, 3, null]);
    expect(wrapped.rows[3].average).toBe(8);
    expect(new Set(wrapped.rows.map((row) => row.key)).size).toBe(4);
  });

  it("handles One Piece–sized seasons", () => {
    const huge = buildGrid([longSeason(1, 1180)]);
    expect(huge.rows).toHaveLength(48);
    expect(huge.rows.at(-1)?.label).toBe("S1 · 1176–1180");
  });
});

describe("getShowStats", () => {
  const stats = getShowStats(seasons);

  it("finds the best and worst episodes", () => {
    expect(stats.best?.title).toBe("Finale");
    expect(stats.worst?.title).toBe("Return");
  });

  it("counts rated and total episodes", () => {
    expect(stats.ratedEpisodes).toBe(4);
    expect(stats.totalEpisodes).toBe(5);
    expect(stats.average).toBeCloseTo((8.1 + 7.4 + 9.3 + 6.5) / 4);
  });

  it("ranks seasons", () => {
    expect(stats.bestSeason?.season).toBe(1);
    expect(stats.worstSeason?.season).toBe(2);
  });

  it("omits a worst season when there is only one", () => {
    expect(getShowStats([seasons[0]]).worstSeason).toBeNull();
  });
});

describe("helpers", () => {
  it("flattens episodes in air order", () => {
    expect(flattenEpisodes([seasons[1], seasons[0]]).map(episodeCode)).toEqual([
      "S1E1",
      "S1E2",
      "S1E4",
      "S2E1",
      "S2E2",
    ]);
  });

  it("formats values", () => {
    expect(average([])).toBeNull();
    expect(formatRating(8)).toBe("8.0");
    expect(formatRating(null)).toBe("–");
    expect(formatVotes(12345)).toBe("12,345 votes");
    expect(formatVotes(1)).toBe("1 vote");
    expect(formatVotes(null)).toBeNull();
  });
});
