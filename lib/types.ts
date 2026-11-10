export type SearchResult = {
  imdbID: string;
  title: string;
  year: string;
  rating: number | null;
  votes: number;
};

export type Series = {
  imdbID: string;
  type: string;
  title: string;
  originalTitle: string | null;
  year: string;
  genre: string | null;
  rating: number | null;
  votes: number;
  totalSeasons: number;
};

export type Episode = {
  imdbID: string;
  season: number;
  episode: number;
  title: string;
  year: number | null;
  rating: number | null;
  votes: number | null;
};

export type Season = {
  number: number;
  episodes: Episode[];
};

export type ShowRatings = {
  series: Series;
  seasons: Season[];
};

/** Poster and summary from TVmaze; IMDb's datasets carry neither. */
export type ShowDetails = {
  poster: string | null;
  plot: string | null;
  url: string;
};
