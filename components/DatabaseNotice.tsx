export function DatabaseNotice() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="text-lg font-semibold">The IMDb ratings database hasn&apos;t been built yet</p>
      <p className="mt-1 opacity-90">
        Ratings come from IMDb&apos;s public datasets, stored locally in{" "}
        <code className="font-mono">data/imdb.sqlite</code>. The download takes a few minutes.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 opacity-90">
        <li>Stop the dev server.</li>
        <li>
          Run <code className="font-mono">npm run db:build</code> in the project root.
        </li>
        <li>
          Start it again with <code className="font-mono">npm run dev</code>.
        </li>
      </ol>
    </div>
  );
}
