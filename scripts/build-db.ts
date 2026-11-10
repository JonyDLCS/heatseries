/**
 * Builds data/imdb.sqlite from IMDb's non-commercial datasets
 * (https://developer.imdb.com/non-commercial-datasets/).
 *
 *   tsx scripts/build-db.ts          build only if missing or older than 7 days
 *   tsx scripts/build-db.ts --force  always rebuild
 */
import { fork } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import readline from "node:readline";
import zlib from "node:zlib";

import { createClient, type Client, type InStatement, type InValue } from "@libsql/client";

import {
  cleanEpisodeTitle,
  isKeptSeries,
  keepsUnratedEpisodes,
  parseOptionalInt,
  parseOptionalText,
  parseRatingTenths,
  parseSlot,
  parseTconst,
  prefersCandidate,
} from "../lib/imdb-rows";
import { INDEX_SQL, SCHEMA_SQL } from "../lib/schema";
import { normalizeSearch } from "../lib/text";

const DATASETS_URL = "https://datasets.imdbws.com/";
const DB_PATH = path.join(process.cwd(), "data", "imdb.sqlite");
const TMP_PATH = `${DB_PATH}.tmp`;
const MAX_AGE_DAYS = 7;
const WRITER_FLAG = "--writer";
const ROWS_PER_STATEMENT = 200;
const STATEMENTS_PER_BATCH = 50;

type EpisodeRow = {
  seriesId: number;
  season: number;
  episode: number;
  id: number;
  votes: number;
  title: string | null;
  year: number | null;
};

type SeriesRow = {
  id: number;
  type: string;
  title: string;
  originalTitle: string | null;
  startYear: number | null;
  endYear: number | null;
  genres: string | null;
};

function seconds(since: number): string {
  return `${((Date.now() - since) / 1000).toFixed(1)}s`;
}

function ageInDays(file: string): number | null {
  try {
    return (Date.now() - fs.statSync(file).mtimeMs) / 86_400_000;
  } catch {
    return null;
  }
}

function removeFile(file: string) {
  try {
    fs.rmSync(file, { force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error) {
    console.warn(`Could not remove ${file}: ${(error as NodeJS.ErrnoException).code}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Windows can hold a freshly closed file (libsql, antivirus, indexer) for a moment. */
async function renameWithRetry(from: string, to: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 20 || (code !== "EBUSY" && code !== "EPERM" && code !== "EACCES")) throw error;
      await sleep(500);
    }
  }
}

function streamTsv(name: string, onRow: (fields: string[]) => void): Promise<void> {
  const started = Date.now();
  process.stdout.write(`  ${name}:`);

  return new Promise<void>((resolve, reject) => {
    const request = https.get(`${DATASETS_URL}${name}.tsv.gz`, { agent: false }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`${name}: HTTP ${response.statusCode}`));
        return;
      }

      const total = Number(response.headers["content-length"]) || 0;
      let received = 0;
      let nextReport = 25;
      response.on("data", (chunk: Buffer) => {
        received += chunk.length;
        while (total > 0 && (received / total) * 100 >= nextReport && nextReport <= 100) {
          process.stdout.write(` ${nextReport}%`);
          nextReport += 25;
        }
      });
      response.on("error", reject);

      const gunzip = zlib.createGunzip();
      gunzip.on("error", reject);

      const lines = readline.createInterface({ input: response.pipe(gunzip), crlfDelay: Infinity });
      let isHeader = true;
      lines.on("line", (line) => {
        if (isHeader) {
          isHeader = false;
          return;
        }
        onRow(line.split("\t"));
      });
      lines.on("close", () => {
        process.stdout.write(` done in ${seconds(started)}\n`);
        resolve();
      });
    });

    request.on("error", reject);
    request.setTimeout(60_000, () => request.destroy(new Error(`${name}: download stalled`)));
  });
}

async function insertRows(db: Client, table: string, columns: string[], rows: InValue[][]) {
  const placeholders = `(${columns.map(() => "?").join(",")})`;
  const batchSize = ROWS_PER_STATEMENT * STATEMENTS_PER_BATCH;

  for (let start = 0; start < rows.length; start += batchSize) {
    const statements: InStatement[] = [];
    const end = Math.min(rows.length, start + batchSize);
    for (let offset = start; offset < end; offset += ROWS_PER_STATEMENT) {
      const chunk = rows.slice(offset, Math.min(end, offset + ROWS_PER_STATEMENT));
      statements.push({
        sql: `INSERT INTO ${table} (${columns.join(",")}) VALUES ${chunk.map(() => placeholders).join(",")}`,
        args: chunk.flat(),
      });
    }
    await db.batch(statements, "write");
  }
}

async function writeTmpDatabase() {
  console.log("Downloading IMDb datasets (about 280 MB):");

  const ratingTenths = new Map<number, number>();
  const votes = new Map<number, number>();
  await streamTsv("title.ratings", ([tconst, averageRating, numVotes]) => {
    const id = parseTconst(tconst);
    const rating = parseRatingTenths(averageRating);
    if (id === null || rating === null) return;
    ratingTenths.set(id, rating);
    votes.set(id, Number(numVotes) || 0);
  });

  const counts = new Map<number, { rated: number; unrated: number }>();
  await streamTsv("title.episode", ([tconst, parentTconst, season, episode]) => {
    if (!parseSlot(season, episode)) return;
    const id = parseTconst(tconst);
    const seriesId = parseTconst(parentTconst);
    if (id === null || seriesId === null) return;
    let count = counts.get(seriesId);
    if (!count) {
      count = { rated: 0, unrated: 0 };
      counts.set(seriesId, count);
    }
    if (ratingTenths.has(id)) count.rated++;
    else count.unrated++;
  });

  const candidateSeries = new Set<number>();
  const keepsUnrated = new Set<number>();
  for (const [seriesId, count] of counts) {
    if (count.rated === 0) continue;
    candidateSeries.add(seriesId);
    if (keepsUnratedEpisodes(count.rated, count.unrated)) keepsUnrated.add(seriesId);
  }
  counts.clear();

  const slots = new Map<string, EpisodeRow>();
  await streamTsv("title.episode", ([tconst, parentTconst, season, episode]) => {
    const slot = parseSlot(season, episode);
    if (!slot) return;
    const seriesId = parseTconst(parentTconst);
    if (seriesId === null || !candidateSeries.has(seriesId)) return;
    const id = parseTconst(tconst);
    if (id === null) return;
    if (!ratingTenths.has(id) && !keepsUnrated.has(seriesId)) return;

    const key = `${seriesId}:${slot.season}:${slot.episode}`;
    const episodeVotes = votes.get(id) ?? 0;
    const current = slots.get(key);
    if (current && !prefersCandidate(current.votes, episodeVotes)) return;
    slots.set(key, { seriesId, ...slot, id, votes: episodeVotes, title: null, year: null });
  });

  const episodesById = new Map<number, EpisodeRow>();
  for (const row of slots.values()) episodesById.set(row.id, row);
  slots.clear();

  const series = new Map<number, SeriesRow>();
  await streamTsv(
    "title.basics",
    ([tconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, , genres]) => {
      const id = parseTconst(tconst);
      if (id === null) return;

      const episode = episodesById.get(id);
      if (episode) {
        episode.title = cleanEpisodeTitle(parseOptionalText(primaryTitle));
        episode.year = parseOptionalInt(startYear);
        return;
      }

      const title = parseOptionalText(primaryTitle);
      if (!title || !candidateSeries.has(id) || !isKeptSeries(titleType, isAdult)) return;
      const original = parseOptionalText(originalTitle);
      series.set(id, {
        id,
        type: titleType,
        title,
        originalTitle: original && original !== title ? original : null,
        startYear: parseOptionalInt(startYear),
        endYear: parseOptionalInt(endYear),
        genres: parseOptionalText(genres)?.replaceAll(",", ", ") ?? null,
      });
    },
  );

  const episodes = [...episodesById.values()]
    .filter((row) => series.has(row.seriesId))
    .sort((a, b) => a.seriesId - b.seriesId || a.season - b.season || a.episode - b.episode);
  episodesById.clear();

  console.log(`Writing ${series.size.toLocaleString()} shows and ${episodes.length.toLocaleString()} episodes...`);
  const writeStarted = Date.now();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  removeFile(TMP_PATH);

  const relativePath = path.relative(process.cwd(), TMP_PATH).replaceAll("\\", "/");
  const db = createClient({ url: `file:${relativePath}` });
  try {
    await db.executeMultiple(`PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF; ${SCHEMA_SQL}`);

    await insertRows(
      db,
      "series",
      ["id", "type", "title", "original_title", "search", "search_original", "start_year", "end_year", "genres", "rating", "votes"],
      [...series.values()].map((row) => {
        const tenths = ratingTenths.get(row.id);
        return [
          row.id,
          row.type,
          row.title,
          row.originalTitle,
          normalizeSearch(row.title),
          row.originalTitle ? normalizeSearch(row.originalTitle) : null,
          row.startYear,
          row.endYear,
          row.genres,
          tenths === undefined ? null : tenths / 10,
          votes.get(row.id) ?? 0,
        ];
      }),
    );

    await insertRows(
      db,
      "episodes",
      ["series_id", "season", "episode", "id", "title", "year", "rating", "votes"],
      episodes.map((row) => {
        const tenths = ratingTenths.get(row.id);
        return [
          row.seriesId,
          row.season,
          row.episode,
          row.id,
          row.title,
          row.year,
          tenths === undefined ? null : tenths / 10,
          tenths === undefined ? null : row.votes,
        ];
      }),
    );

    await db.batch(
      [
        { sql: "INSERT INTO meta (key, value) VALUES ('built_at', ?)", args: [new Date().toISOString()] },
        { sql: "INSERT INTO meta (key, value) VALUES ('series', ?)", args: [String(series.size)] },
        { sql: "INSERT INTO meta (key, value) VALUES ('episodes', ?)", args: [String(episodes.length)] },
      ],
      "write",
    );
    await db.executeMultiple(`${INDEX_SQL} ANALYZE;`);
  } finally {
    db.close();
  }
  console.log(`  written in ${seconds(writeStarted)}`);
}

/**
 * libsql keeps the file locked on Windows until the process exits, even after
 * `close()`, so the database is written by a child process and swapped in here.
 */
function runWriter(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = fork(process.argv[1], [WRITER_FLAG], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`see the error above (exit code ${code})`))));
  });
}

async function build() {
  const started = Date.now();
  await runWriter();

  try {
    await renameWithRetry(TMP_PATH, DB_PATH);
  } catch (error) {
    throw new Error(
      `Could not replace ${DB_PATH} (${(error as NodeJS.ErrnoException).code}). ` +
        "Stop the running app and try again.",
    );
  }

  const sizeMb = fs.statSync(DB_PATH).size / 1024 / 1024;
  console.log(`Built ${DB_PATH} (${sizeMb.toFixed(1)} MB) in ${seconds(started)}.`);
}

async function main() {
  if (process.argv.includes(WRITER_FLAG)) {
    try {
      await writeTmpDatabase();
    } catch (error) {
      console.error(`\n${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
    return;
  }

  const force = process.argv.includes("--force");
  const age = ageInDays(DB_PATH);

  if (!force && age !== null && age < MAX_AGE_DAYS) {
    console.log(`IMDb database is ${age.toFixed(1)} days old; it refreshes after ${MAX_AGE_DAYS} days.`);
    return;
  }

  console.log(
    age === null
      ? "No IMDb database yet; building it now. This takes a few minutes."
      : `IMDb database is ${age.toFixed(1)} days old; refreshing it.`,
  );

  try {
    await build();
  } catch (error) {
    removeFile(TMP_PATH);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nBuilding the IMDb database failed: ${message}`);
    if (force) {
      process.exitCode = 1;
    } else if (age !== null) {
      console.error("Keeping the existing database. Run `npm run db:build` to retry.");
    } else {
      console.error("The app will start without data. Run `npm run db:build` to retry.");
    }
  }
}

void main();
