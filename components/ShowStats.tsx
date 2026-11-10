import { episodeCode, formatRating, imdbTitleUrl, type ShowStats as Stats } from "@/lib/ratings";
import type { Episode } from "@/lib/types";

import { RatingBadge } from "./RatingBadge";

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EpisodeStat({ episode }: { episode: Episode | null }) {
  if (!episode) return <p className="text-zinc-500">–</p>;
  return (
    <a href={imdbTitleUrl(episode.imdbID)} target="_blank" rel="noreferrer" className="group block">
      <div className="flex items-center gap-2">
        <RatingBadge rating={episode.rating} />
        <span className="text-sm text-zinc-500">{episodeCode(episode)}</span>
      </div>
      <p className="mt-1 truncate font-medium group-hover:underline">{episode.title}</p>
    </a>
  );
}

export function ShowStats({ stats }: { stats: Stats }) {
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Average episode">
        <div className="flex items-center gap-2">
          <RatingBadge rating={stats.average} className="text-lg" />
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {stats.ratedEpisodes} of {stats.totalEpisodes} episodes rated
        </p>
      </Card>
      <Card label="Best episode">
        <EpisodeStat episode={stats.best} />
      </Card>
      <Card label="Worst episode">
        <EpisodeStat episode={stats.worst} />
      </Card>
      <Card label="Seasons">
        {stats.bestSeason ? (
          <div className="space-y-1 text-sm">
            <p>
              Best: <span className="font-medium">Season {stats.bestSeason.season}</span>{" "}
              <span className="text-zinc-500">({formatRating(stats.bestSeason.average)})</span>
            </p>
            {stats.worstSeason && (
              <p>
                Worst: <span className="font-medium">Season {stats.worstSeason.season}</span>{" "}
                <span className="text-zinc-500">({formatRating(stats.worstSeason.average)})</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-zinc-500">–</p>
        )}
      </Card>
    </section>
  );
}
