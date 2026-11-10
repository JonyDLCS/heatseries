import Link from "next/link";

export default function ShowNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Show not found</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        That IMDb ID doesn&apos;t match a TV series. Search by title instead.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Back to search
      </Link>
    </div>
  );
}
