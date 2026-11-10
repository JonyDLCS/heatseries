export const SCHEMA_SQL = `
CREATE TABLE series (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  original_title TEXT,
  search TEXT NOT NULL,
  search_original TEXT,
  start_year INTEGER,
  end_year INTEGER,
  genres TEXT,
  rating REAL,
  votes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE episodes (
  series_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  id INTEGER NOT NULL,
  title TEXT,
  year INTEGER,
  rating REAL,
  votes INTEGER,
  PRIMARY KEY (series_id, season, episode)
) WITHOUT ROWID;

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const INDEX_SQL = `
CREATE INDEX series_votes ON series (votes DESC);
`;
