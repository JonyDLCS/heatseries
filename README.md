# HeatSeries

See the IMDb rating of every episode of a TV series as a heatmap: seasons down the side, episodes across, each cell colored by its score.

- Search about 47,000 series by title (English or original, accents optional).
- Heatmap with season averages, a hover tooltip (title, year, score, votes), and a toggle to flip seasons between rows and columns. Each cell links to the episode on IMDb.
- Very long seasons (One Piece has 1,180 episodes in a single IMDb "season") wrap into rows of 25, each with its own average.
- Summary cards for the average episode, best and worst episodes, and best and worst seasons.
- A trend chart of every episode in air order.
- Posters and summaries from TVmaze; recently viewed shows are kept in your browser.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4 and SQLite (`@libsql/client`).

## Setup

```bash
npm install
npm run dev
```

The first `npm run dev` downloads IMDb's public datasets (about 280 MB) and builds `data/imdb.sqlite` (about 55 MB), which takes a minute or two. After that the app starts immediately. Open [http://localhost:3000](http://localhost:3000).

No API keys are needed.

## Keeping the data fresh

IMDb republishes its datasets daily. `npm run dev` and `npm run build` check the database's age first and rebuild it when it is more than 7 days old, so you never need to run anything by hand. To refresh now:

```bash
npm run db:build
```

Stop the dev server first. On Windows the running app keeps the database file locked, so it can't be replaced; the script says so if that happens and keeps the old copy.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Refresh the database if it's older than 7 days, then start the dev server |
| `npm run build` | Same refresh, then a production build |
| `npm start` | Serve the production build |
| `npm run db:build` | Rebuild the database now |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest) |

## What's in the database

`scripts/build-db.ts` streams three files from [IMDb's non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/): `title.ratings`, `title.episode` and `title.basics`. It keeps:

- TV series and miniseries (not adult titles) that have at least one rated episode.
- Episodes with a season and episode number. Unrated episodes are kept only when a show has at least as many rated episodes as unrated ones, so daily soaps and talk shows don't fill up with gray cells.
- Titles like "Episode #1.5" are treated as untitled. When two episodes claim the same slot, the one with more votes wins.

It writes to `data/imdb.sqlite.tmp` and swaps it in only once it is complete, so a failed download never breaks a working copy.

## Project layout

```
app/
  page.tsx               Home: search, popular shows, recently viewed
  api/search/route.ts    Title search against the local database
  show/[id]/             Show page, loading skeleton, error and not-found states
components/              Heatmap, legend, stats, trend chart, search box
scripts/build-db.ts      Downloads the IMDb datasets and builds the database
lib/
  imdb-rows.ts           Rules for parsing and filtering dataset rows
  schema.ts              SQLite schema
  db.ts                  Database client (server only)
  queries.ts             Search, series and episode queries
  tvmaze.ts              Poster and summary lookup, cached for a week
  ratings.ts             Grid building and wrapping, averages, best/worst
  colors.ts              Score-to-color buckets
```

## Deploying

### Vercel

1. Import the repository on [Vercel](https://vercel.com/new) and keep the defaults. No environment variables are needed.
2. Each deploy runs `npm run build`, which first downloads IMDb's datasets and builds `data/imdb.sqlite` (about 80 seconds). `outputFileTracingIncludes` in `next.config.ts` ships the file with the server functions.
3. To refresh the data weekly, create a Deploy Hook (Project → Settings → Git → Deploy Hooks) and save its URL as a GitHub repository secret named `VERCEL_DEPLOY_HOOK`. The workflow in `.github/workflows/refresh-data.yml` calls it every Monday; you can also run it by hand from the **Actions** tab.

Vercel's free Hobby plan is for non-commercial use, which matches IMDb's dataset terms.

### Your own server

Run `npm run build && npm start`. The database is built during the build, but a long-running server doesn't refresh it on its own: schedule `npm run db:build` followed by an app restart (for example weekly with cron).

## Data and licensing

Information courtesy of IMDb (https://www.imdb.com). Used with permission. IMDb's datasets are for personal and non-commercial use only.

Posters and summaries come from [TVmaze](https://www.tvmaze.com/api), licensed under [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/).

This project is not affiliated with or endorsed by IMDb or TVmaze.
