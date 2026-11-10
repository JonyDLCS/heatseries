import Link from "next/link";

import { DatabaseNotice } from "@/components/DatabaseNotice";
import { RecentShows } from "@/components/RecentShows";
import { SearchBox } from "@/components/SearchBox";
import { RATING_BUCKETS } from "@/lib/colors";
import { hasDatabase } from "@/lib/db";
import { POPULAR_SHOWS } from "@/lib/popular";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-12 sm:py-20">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex gap-1" aria-hidden>
          {[...RATING_BUCKETS].reverse().map((bucket) => (
            <span key={bucket.label} className={`h-3 w-8 rounded-sm ${bucket.className}`} />
          ))}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Every episode, one glance.
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Search any TV series and see its IMDb episode ratings as a heatmap, season by season.
        </p>
        <div className="w-full max-w-xl">
          <SearchBox autoFocus />
        </div>
      </section>

      {!hasDatabase() && <DatabaseNotice />}

      <RecentShows />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Popular</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {POPULAR_SHOWS.map((show) => (
            <li key={show.imdbID}>
              <Link
                href={`/show/${show.imdbID}`}
                className="flex h-full flex-col rounded-xl border border-zinc-200 p-4 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md dark:border-zinc-800"
              >
                <span className="font-medium">{show.title}</span>
                <span className="mt-1 text-sm text-zinc-500">{show.year}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
