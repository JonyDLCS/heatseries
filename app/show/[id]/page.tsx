import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DatabaseNotice } from "@/components/DatabaseNotice";
import { Heatmap } from "@/components/Heatmap";
import { Legend } from "@/components/Legend";
import { RatingTrend } from "@/components/RatingTrend";
import { ShowHeader } from "@/components/ShowHeader";
import { ShowStats } from "@/components/ShowStats";
import { TrackRecent } from "@/components/TrackRecent";
import { getSeries, getShowRatings, hasDatabase } from "@/lib/db";
import { isImdbId } from "@/lib/queries";
import { buildGrid, getShowStats } from "@/lib/ratings";
import { getShowDetails } from "@/lib/tvmaze";
import type { ShowDetails } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/show/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isImdbId(id) || !hasDatabase()) return { title: "Episode ratings" };

  const series = await getSeries(id);
  if (!series) return { title: "Show not found" };
  return {
    title: `${series.title}: episode ratings heatmap`,
    description: `IMDb ratings for every episode of ${series.title} (${series.year}), shown as a heatmap by season.`,
  };
}

async function loadDetails(imdbID: string): Promise<ShowDetails | null> {
  try {
    return await getShowDetails(imdbID);
  } catch (error) {
    console.warn(`TVmaze lookup failed for ${imdbID}:`, error);
    return null;
  }
}

export default async function ShowPage({ params }: PageProps<"/show/[id]">) {
  const { id } = await params;
  if (!isImdbId(id)) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← Search another show
      </Link>
      <ShowContent id={id} />
    </div>
  );
}

async function ShowContent({ id }: { id: string }) {
  if (!hasDatabase()) return <DatabaseNotice />;

  const [show, details] = await Promise.all([getShowRatings(id), loadDetails(id)]);
  if (!show) notFound();

  const { series, seasons } = show;
  return (
    <>
      <TrackRecent imdbID={series.imdbID} title={series.title} year={series.year} />
      <ShowHeader series={series} details={details} seasonCount={seasons.length} />
      <ShowStats stats={getShowStats(seasons)} />
      <Heatmap grid={buildGrid(seasons)} />
      <Legend />
      <RatingTrend seasons={seasons} />
    </>
  );
}
