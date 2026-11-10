import { describe, expect, it } from "vitest";

import { formatYears, normalizeSearch, stripHtml } from "./text";
import { toShowDetails } from "./tvmaze-parse";

describe("normalizeSearch", () => {
  it("drops accents, case and punctuation", () => {
    expect(normalizeSearch("Pokémon")).toBe("pokemon");
    expect(normalizeSearch("Marvel's Agents of S.H.I.E.L.D.")).toBe("marvel s agents of s h i e l d");
    expect(normalizeSearch("  Law & Order  ")).toBe("law and order");
  });

  it("keeps non-Latin scripts", () => {
    expect(normalizeSearch("ワンピース")).toBe("ワンピース");
  });
});

describe("formatYears", () => {
  it("formats ranges, ongoing shows and single years", () => {
    expect(formatYears(2008, 2013, "tvSeries")).toBe("2008–2013");
    expect(formatYears(1999, null, "tvSeries")).toBe("1999–");
    expect(formatYears(2019, null, "tvMiniSeries")).toBe("2019");
    expect(formatYears(2019, 2019, "tvMiniSeries")).toBe("2019");
    expect(formatYears(null, null, "tvSeries")).toBe("");
  });
});

describe("stripHtml", () => {
  it("removes tags and decodes entities", () => {
    expect(stripHtml("<p><b>Walter White</b>, a chemistry teacher &amp; father&#39;s&nbsp;story.</p>")).toBe(
      "Walter White, a chemistry teacher & father's story.",
    );
    expect(stripHtml("<p>One.</p><p>Two.<br/>Three.</p>")).toBe("One. Two. Three.");
  });
});

describe("toShowDetails", () => {
  it("prefers the original poster and strips the summary", () => {
    expect(
      toShowDetails({
        url: "https://www.tvmaze.com/shows/169/breaking-bad",
        summary: "<p>A teacher turns to crime.</p>",
        image: {
          medium: "https://static.tvmaze.com/uploads/images/medium_portrait/0/2400.jpg",
          original: "https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg",
        },
      }),
    ).toEqual({
      poster: "https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg",
      plot: "A teacher turns to crime.",
      url: "https://www.tvmaze.com/shows/169/breaking-bad",
    });
  });

  it("copes with missing images and summaries", () => {
    expect(toShowDetails({ url: "https://www.tvmaze.com/shows/1", summary: null, image: null })).toEqual({
      poster: null,
      plot: null,
      url: "https://www.tvmaze.com/shows/1",
    });
  });

  it("ignores non-https images", () => {
    expect(toShowDetails({ image: { medium: "http://example.com/a.jpg" } }).poster).toBeNull();
  });
});
