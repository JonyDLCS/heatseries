import Image from "next/image";

import { imdbTitleUrl } from "@/lib/ratings";
import type { Series, ShowDetails } from "@/lib/types";

import { RatingBadge } from "./RatingBadge";

export function ShowHeader({
  series,
  details,
  seasonCount,
}: {
  series: Series;
  details: ShowDetails | null;
  seasonCount: number;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row">
      <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-200 shadow-md sm:w-40 dark:bg-zinc-800">
        {details?.poster ? (
          <Image
            src={details.poster}
            alt={`${series.title} poster`}
            fill
            sizes="160px"
            priority
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center p-2 text-center text-sm text-zinc-500">
            No poster
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{series.title}</h1>
          {series.originalTitle && <p className="mt-1 text-zinc-500 italic">{series.originalTitle}</p>}
          <p className="mt-1 text-zinc-500">
            {series.year}
            {series.genre && <> · {series.genre}</>}
            {" · "}
            {seasonCount} {seasonCount === 1 ? "season" : "seasons"}
          </p>
        </div>

        {details?.plot && <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">{details.plot}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <RatingBadge rating={series.rating} className="text-base" />
            <span className="text-zinc-500">
              IMDb series rating
              {series.votes > 0 && <> · {series.votes.toLocaleString("en-US")} votes</>}
            </span>
          </span>
          <a
            href={imdbTitleUrl(series.imdbID)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            View on IMDb ↗
          </a>
          {details && (
            <a
              href={details.url}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-500 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
            >
              TVmaze ↗
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
