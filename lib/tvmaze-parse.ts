import { stripHtml } from "./text";
import type { ShowDetails } from "./types";

export type TvmazeShow = {
  url?: string;
  summary?: string | null;
  image?: { medium?: string; original?: string } | null;
};

function httpsUrl(value: string | undefined): string | null {
  return value && value.startsWith("https://") ? value : null;
}

export function toShowDetails(show: TvmazeShow): ShowDetails {
  const plot = show.summary ? stripHtml(show.summary) : "";
  return {
    poster: httpsUrl(show.image?.original) ?? httpsUrl(show.image?.medium),
    plot: plot === "" ? null : plot,
    url: httpsUrl(show.url) ?? "https://www.tvmaze.com/",
  };
}
