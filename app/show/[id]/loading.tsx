export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-8 px-4 py-8"
      aria-busy="true"
      aria-label="Loading episode ratings"
    >
      <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[2/3] w-32 rounded-xl bg-zinc-200 sm:w-40 dark:bg-zinc-800" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-9 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-full max-w-xl rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-5/6 max-w-lg rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="flex gap-1">
            {Array.from({ length: 12 }, (_, col) => (
              <div key={col} className="h-8 w-11 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
