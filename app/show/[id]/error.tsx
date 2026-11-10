"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ShowError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Couldn&apos;t load this show</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Something went wrong while reading the local ratings database. If you just ran{" "}
        <code className="font-mono">npm run db:build</code>, restart the dev server and try again.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:border-zinc-500 dark:border-zinc-700"
        >
          Back to search
        </Link>
      </div>
    </div>
  );
}
