"use client";

import { useEffect, useState } from "react";

import { getRatingBucket } from "@/lib/colors";
import {
  episodeCode,
  formatRating,
  formatVotes,
  imdbTitleUrl,
  type HeatmapGrid,
} from "@/lib/ratings";
import type { Episode } from "@/lib/types";

type Orientation = "seasons-as-rows" | "seasons-as-columns";

type Tip = { episode: Episode; x: number; y: number; above: boolean };

type Line = { key: string; label: string; cells: (Episode | null)[]; average?: number | null };

const CELL = "h-8 w-11";
const TD = "p-0.5";

function EpisodeCell({
  episode,
  onShow,
  onHide,
}: {
  episode: Episode | null;
  onShow: (episode: Episode, target: HTMLElement) => void;
  onHide: () => void;
}) {
  if (!episode) {
    return (
      <td className={TD}>
        <div className={CELL} />
      </td>
    );
  }

  const bucket = getRatingBucket(episode.rating);
  const score = episode.rating === null ? "no score" : formatRating(episode.rating);
  return (
    <td className={TD}>
      <a
        href={imdbTitleUrl(episode.imdbID)}
        target="_blank"
        rel="noreferrer"
        aria-label={`${episodeCode(episode)} ${episode.title}: ${score}`}
        onMouseEnter={(event) => onShow(episode, event.currentTarget)}
        onMouseLeave={onHide}
        onFocus={(event) => onShow(episode, event.currentTarget)}
        onBlur={onHide}
        className={`${CELL} flex items-center justify-center rounded-md font-semibold tabular-nums outline-none transition hover:z-10 hover:scale-110 hover:shadow-md focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white ${bucket.className}`}
      >
        {formatRating(episode.rating)}
      </a>
    </td>
  );
}

function AverageCell({ value }: { value: number | null }) {
  const bucket = getRatingBucket(value);
  return (
    <td className={`${TD} pr-2`}>
      <div
        title={value === null ? "No rated episodes" : `Average ${value.toFixed(2)}`}
        className={`${CELL} flex items-center justify-center rounded-md border-2 border-white/60 font-bold tabular-nums shadow-inner dark:border-black/30 ${bucket.className}`}
      >
        {formatRating(value)}
      </div>
    </td>
  );
}

const headerCell =
  "sticky top-0 z-20 bg-white px-0.5 pt-2 pb-1 text-center font-medium text-zinc-500 dark:bg-zinc-950";
const rowHeaderCell =
  "sticky left-0 z-20 bg-white pr-2 pl-2 text-right font-medium whitespace-nowrap text-zinc-500 dark:bg-zinc-950";

export function Heatmap({ grid }: { grid: HeatmapGrid }) {
  const [orientation, setOrientation] = useState<Orientation>("seasons-as-rows");
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, []);

  function showTip(episode: Episode, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const above = rect.top > 110;
    setTip({
      episode,
      x: rect.left + rect.width / 2,
      y: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  }
  const hideTip = () => setTip(null);

  const offsets = Array.from({ length: grid.columns }, (_, i) => i);
  const seasonsAsRows = grid.wrapped || orientation === "seasons-as-rows";

  const columns = seasonsAsRows
    ? offsets.map((i) => (grid.wrapped ? `${i + 1}` : `E${i + 1}`))
    : grid.rows.map((row) => `S${row.season}`);
  const lines: Line[] = seasonsAsRows
    ? grid.rows.map((row) => ({
        key: row.key,
        label: row.label,
        cells: row.cells,
        average: row.average,
      }))
    : offsets.map((i) => ({
        key: `e${i + 1}`,
        label: `E${i + 1}`,
        cells: grid.rows.map((row) => row.cells[i]),
      }));

  if (grid.rows.length === 0) {
    return <p className="text-zinc-500">No episode data is available for this show yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Episode ratings</h2>
          {grid.wrapped && (
            <p className="text-sm text-zinc-500">
              Long seasons wrap every {grid.columns} episodes; each row is labelled with its episode range.
            </p>
          )}
        </div>
        {!grid.wrapped && (
        <div
          role="group"
          aria-label="Layout"
          className="inline-flex rounded-lg border border-zinc-200 p-0.5 text-sm dark:border-zinc-800"
        >
          {(
            [
              ["seasons-as-rows", "Seasons as rows"],
              ["seasons-as-columns", "Seasons as columns"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={orientation === value}
              onClick={() => setOrientation(value)}
              className={`rounded-md px-3 py-1 transition ${
                orientation === value
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        )}
      </div>

      <div
        onScroll={hideTip}
        className="max-h-[75vh] overflow-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      >
        <table className="mb-1.5 border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-white dark:bg-zinc-950">
                <span className="sr-only">{seasonsAsRows ? "Season" : "Episode"}</span>
              </th>
              {columns.map((label) => (
                <th key={label} scope="col" className={headerCell}>
                  {label}
                </th>
              ))}
              {seasonsAsRows && (
                <th scope="col" className={headerCell}>
                  Avg
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key}>
                <th scope="row" className={rowHeaderCell}>
                  {line.label}
                </th>
                {line.cells.map((episode, index) => (
                  <EpisodeCell
                    key={`${line.key}-${index}`}
                    episode={episode}
                    onShow={showTip}
                    onHide={hideTip}
                  />
                ))}
                {seasonsAsRows && <AverageCell value={line.average ?? null} />}
              </tr>
            ))}
            {!seasonsAsRows && (
              <tr>
                <th scope="row" className={rowHeaderCell}>
                  Avg
                </th>
                {grid.rows.map((row) => (
                  <AverageCell key={row.key} value={row.average} />
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {tip && (
        <div
          role="tooltip"
          style={{ left: tip.x, top: tip.y }}
          className={`pointer-events-none fixed z-50 w-64 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 ${
            tip.above ? "-translate-y-full" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs opacity-70">{episodeCode(tip.episode)}</span>
            <span className="font-semibold tabular-nums">
              {tip.episode.rating === null ? "No score yet" : `★ ${formatRating(tip.episode.rating)}`}
            </span>
          </div>
          <p className="mt-1 font-medium leading-snug">{tip.episode.title}</p>
          <p className="mt-0.5 text-xs opacity-70">
            {[tip.episode.year ?? "Year unknown", formatVotes(tip.episode.votes)].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
