import { getRatingBucket } from "@/lib/colors";
import { episodeCode, flattenEpisodes, formatRating, seasonAverage } from "@/lib/ratings";
import type { Season } from "@/lib/types";

const WIDTH = 1000;
const HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 30, left: 36 };

export function RatingTrend({ seasons }: { seasons: Season[] }) {
  const episodes = flattenEpisodes(seasons);
  const rated = episodes.flatMap((episode) => (episode.rating === null ? [] : [episode.rating]));
  if (rated.length < 2) return null;

  const yMin = Math.max(0, Math.floor(Math.min(...rated)) - 1);
  const yMax = 10;
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index / Math.max(1, episodes.length - 1)) * innerWidth;
  const y = (rating: number) => PAD.top + ((yMax - rating) / (yMax - yMin)) * innerHeight;
  const radius = episodes.length > 300 ? 1.5 : episodes.length > 100 ? 2.5 : 4;

  let path = "";
  let penDown = false;
  episodes.forEach((episode, index) => {
    if (episode.rating === null) {
      penDown = false;
      return;
    }
    path += `${penDown ? "L" : "M"}${x(index).toFixed(1)},${y(episode.rating).toFixed(1)}`;
    penDown = true;
  });

  const ranges: { season: Season; start: number; end: number }[] = [];
  let offset = 0;
  for (const season of [...seasons].sort((a, b) => a.number - b.number)) {
    ranges.push({ season, start: offset, end: offset + season.episodes.length - 1 });
    offset += season.episodes.length;
  }
  const labelEvery = Math.ceil(ranges.length / 20);
  const ticks = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Rating trend</h2>
      <div className="rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full text-zinc-400"
          role="img"
          aria-label={`IMDb rating of each of ${episodes.length} episodes in air order`}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="currentColor">
                {tick}
              </text>
            </g>
          ))}

          {ranges.map(({ season, start, end }, index) => {
            const avg = seasonAverage(season);
            return (
              <g key={season.number}>
                {index > 0 && (
                  <line
                    x1={(x(start - 1) + x(start)) / 2}
                    x2={(x(start - 1) + x(start)) / 2}
                    y1={PAD.top}
                    y2={HEIGHT - PAD.bottom}
                    stroke="currentColor"
                    strokeOpacity={0.35}
                    strokeDasharray="3 4"
                  />
                )}
                {avg !== null && (
                  <line
                    x1={x(start)}
                    x2={x(end)}
                    y1={y(avg)}
                    y2={y(avg)}
                    stroke={getRatingBucket(avg).hex}
                    strokeWidth={3}
                    strokeOpacity={0.5}
                    strokeLinecap="round"
                  >
                    <title>{`Season ${season.number} average: ${formatRating(avg)}`}</title>
                  </line>
                )}
                {index % labelEvery === 0 && (
                  <text
                    x={(x(start) + x(end)) / 2}
                    y={HEIGHT - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fill="currentColor"
                  >
                    S{season.number}
                  </text>
                )}
              </g>
            );
          })}

          <path d={path} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.5} />

          {episodes.map((episode, index) =>
            episode.rating === null ? null : (
              <circle
                key={episodeCode(episode)}
                cx={x(index)}
                cy={y(episode.rating)}
                r={radius}
                fill={getRatingBucket(episode.rating).hex}
                stroke="white"
                strokeWidth={radius > 2 ? 1 : 0}
              >
                <title>{`${episodeCode(episode)} · ${episode.title} · ${formatRating(episode.rating)}`}</title>
              </circle>
            ),
          )}
        </svg>
      </div>
      <p className="text-sm text-zinc-500">
        Dots are episodes in air order. Shaded bars mark each season&apos;s average.
      </p>
    </section>
  );
}
