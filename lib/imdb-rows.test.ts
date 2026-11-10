import { describe, expect, it } from "vitest";

import {
  cleanEpisodeTitle,
  formatTconst,
  isKeptSeries,
  keepsUnratedEpisodes,
  parseOptionalInt,
  parseOptionalText,
  parseRatingTenths,
  parseSlot,
  parseTconst,
  prefersCandidate,
} from "./imdb-rows";

describe("title IDs", () => {
  it("round-trips padded IDs", () => {
    expect(parseTconst("tt0388629")).toBe(388629);
    expect(formatTconst(388629)).toBe("tt0388629");
    expect(formatTconst(12345678)).toBe("tt12345678");
  });

  it("rejects anything else", () => {
    expect(parseTconst("nm0000001")).toBeNull();
    expect(parseTconst("tt")).toBeNull();
    expect(parseTconst("ttabc")).toBeNull();
  });
});

describe("field parsing", () => {
  it("treats \\N and blanks as null", () => {
    expect(parseOptionalInt("\\N")).toBeNull();
    expect(parseOptionalInt("")).toBeNull();
    expect(parseOptionalInt("2008")).toBe(2008);
    expect(parseOptionalText("\\N")).toBeNull();
    expect(parseOptionalText("Drama")).toBe("Drama");
  });

  it("needs both a season and an episode number of at least 1", () => {
    expect(parseSlot("1", "5")).toEqual({ season: 1, episode: 5 });
    expect(parseSlot("\\N", "5")).toBeNull();
    expect(parseSlot("1", "\\N")).toBeNull();
    expect(parseSlot("0", "1")).toBeNull();
  });

  it("stores ratings as tenths", () => {
    expect(parseRatingTenths("8.7")).toBe(87);
    expect(parseRatingTenths("10.0")).toBe(100);
    expect(parseRatingTenths("0")).toBeNull();
    expect(parseRatingTenths("\\N")).toBeNull();
  });
});

describe("filtering rules", () => {
  it("keeps unrated episodes only for mostly rated shows", () => {
    expect(keepsUnratedEpisodes(10, 2)).toBe(true);
    expect(keepsUnratedEpisodes(5, 5)).toBe(true);
    expect(keepsUnratedEpisodes(3, 4000)).toBe(false);
    expect(keepsUnratedEpisodes(0, 0)).toBe(false);
  });

  it("keeps series and miniseries, but not adult titles", () => {
    expect(isKeptSeries("tvSeries", "0")).toBe(true);
    expect(isKeptSeries("tvMiniSeries", "0")).toBe(true);
    expect(isKeptSeries("tvSeries", "1")).toBe(false);
    expect(isKeptSeries("movie", "0")).toBe(false);
    expect(isKeptSeries("tvEpisode", "0")).toBe(false);
  });

  it("drops placeholder episode titles", () => {
    expect(cleanEpisodeTitle("Episode #1.5")).toBeNull();
    expect(cleanEpisodeTitle("Episode 12")).toBeNull();
    expect(cleanEpisodeTitle("Episode dated 3 March 2004")).toBeNull();
    expect(cleanEpisodeTitle("  ")).toBeNull();
    expect(cleanEpisodeTitle(null)).toBeNull();
    expect(cleanEpisodeTitle(" Ozymandias ")).toBe("Ozymandias");
    expect(cleanEpisodeTitle("Episode One: The Return")).toBe("Episode One: The Return");
  });

  it("resolves duplicate slots by votes", () => {
    expect(prefersCandidate(100, 200)).toBe(true);
    expect(prefersCandidate(200, 100)).toBe(false);
    expect(prefersCandidate(100, 100)).toBe(false);
  });
});
