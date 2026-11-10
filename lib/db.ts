import "server-only";

import fs from "node:fs";
import path from "node:path";

import { createClient, type Client } from "@libsql/client";
import { cacheLife } from "next/cache";

import * as queries from "./queries";
import type { SearchResult, Series, ShowRatings } from "./types";

const DB_FILE = path.join(process.cwd(), "data", "imdb.sqlite");

export function hasDatabase(): boolean {
  return fs.existsSync(DB_FILE);
}

const globalForDb = globalThis as typeof globalThis & { __imdbDb?: Client };

function db(): Client {
  if (!hasDatabase()) {
    throw new Error("The IMDb database has not been built. Run `npm run db:build`.");
  }
  globalForDb.__imdbDb ??= createClient({ url: "file:data/imdb.sqlite" });
  return globalForDb.__imdbDb;
}

export function searchSeries(query: string): Promise<SearchResult[]> {
  return queries.searchSeries(db(), query);
}

export function getSeries(imdbID: string): Promise<Series | null> {
  return queries.getSeries(db(), imdbID);
}

export function getShowRatings(imdbID: string): Promise<ShowRatings | null> {
  return queries.getShowRatings(db(), imdbID);
}

/** The database only changes on rebuild, which needs a restart or redeploy, so this can be cached. */
export async function getDataInfo(): Promise<queries.DataInfo | null> {
  "use cache";
  cacheLife("days");

  if (!hasDatabase()) return null;
  try {
    return await queries.getDataInfo(db());
  } catch {
    return null;
  }
}
