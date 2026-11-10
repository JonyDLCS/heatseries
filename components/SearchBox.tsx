"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type KeyboardEvent } from "react";

import { MIN_QUERY_LENGTH } from "@/lib/queries";
import type { SearchResult } from "@/lib/types";

import { RatingBadge } from "./RatingBadge";

const MIN_QUERY = MIN_QUERY_LENGTH;
const DEBOUNCE_MS = 250;

type SearchError = "no_database" | "server_error";

const ERROR_MESSAGES: Record<SearchError, { title: string; body: string }> = {
  no_database: {
    title: "The ratings database hasn't been built yet",
    body: "Run npm run db:build in the project root, then restart the dev server.",
  },
  server_error: {
    title: "Search failed",
    body: "Something went wrong while searching. Try again in a moment.",
  },
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: SearchResult[] }
  | { status: "error"; code: SearchError };

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data: { results?: SearchResult[]; error?: string } = await response.json();
        if (!response.ok || !data.results) {
          setState({ status: "error", code: data.error === "no_database" ? "no_database" : "server_error" });
          return;
        }
        setState({ status: "done", results: data.results });
        setActive(data.results.length > 0 ? 0 : -1);
      } catch {
        if (!controller.signal.aborted) setState({ status: "error", code: "server_error" });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = state.status === "done" ? state.results : [];
  const showPanel = open && query.trim().length >= MIN_QUERY && state.status !== "idle";

  function choose(result: SearchResult) {
    setOpen(false);
    router.push(`/show/${result.imdbID}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && showPanel && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search for a TV series
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && active >= 0 ? `${listId}-option-${active}` : undefined}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        placeholder="Search a series, e.g. Breaking Bad"
        value={query}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setOpen(true);
          if (value.trim().length < MIN_QUERY) {
            setState({ status: "idle" });
            setActive(-1);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
      />

      {showPanel && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {state.status === "loading" && (
            <p className="px-4 py-3 text-sm text-zinc-500">Searching…</p>
          )}
          {state.status === "error" && (
            <div className="px-4 py-3 text-sm">
              <p className="font-medium text-red-600 dark:text-red-400">
                {ERROR_MESSAGES[state.code].title}
              </p>
              <p className="mt-1 text-zinc-500">{ERROR_MESSAGES[state.code].body}</p>
            </div>
          )}
          {state.status === "done" && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500">
              No series found. Try the full title.
            </p>
          )}
          {results.length > 0 && (
            <ul id={`${listId}-list`} role="listbox" className="max-h-96 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li
                  key={result.imdbID}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(result)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 ${
                    index === active ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{result.title}</p>
                    <p className="text-sm text-zinc-500">
                      {result.year}
                      {result.votes > 0 && <> · {result.votes.toLocaleString("en-US")} votes</>}
                    </p>
                  </div>
                  <RatingBadge rating={result.rating} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
