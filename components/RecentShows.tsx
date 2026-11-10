"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { clearRecent, getRecentSnapshot, parseRecent, subscribeRecent } from "@/lib/recent";

export function RecentShows() {
  const raw = useSyncExternalStore(subscribeRecent, getRecentSnapshot, () => null);
  const shows = useMemo(() => parseRecent(raw), [raw]);

  if (shows.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Recently viewed</h2>
        <button
          type="button"
          onClick={clearRecent}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Clear
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {shows.map((show) => (
          <li key={show.imdbID}>
            <Link
              href={`/show/${show.imdbID}`}
              className="block rounded-full border border-zinc-300 px-3 py-1.5 text-sm transition hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-700 dark:hover:text-emerald-400"
            >
              {show.title}
              <span className="ml-1.5 text-zinc-500">{show.year}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
