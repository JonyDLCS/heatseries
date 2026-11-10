import { getDataInfo } from "@/lib/db";

export async function DataStamp() {
  const info = await getDataInfo();
  if (!info) return null;

  const date = new Date(info.builtAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    <p>
      Data updated <time dateTime={info.builtAt}>{date}</time> · {info.series.toLocaleString("en-US")} shows ·{" "}
      {info.episodes.toLocaleString("en-US")} episodes
    </p>
  );
}
