import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { DataStamp } from "@/components/DataStamp";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HeatSeries · IMDb episode ratings heatmap",
    template: "%s · HeatSeries",
  },
  description: "See the IMDb rating of every episode of a TV series as a heatmap, season by season.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid grid-cols-2 gap-0.5" aria-hidden>
                <span className="h-2 w-2 rounded-[2px] bg-emerald-700" />
                <span className="h-2 w-2 rounded-[2px] bg-lime-300" />
                <span className="h-2 w-2 rounded-[2px] bg-amber-300" />
                <span className="h-2 w-2 rounded-[2px] bg-green-500" />
              </span>
              HeatSeries
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-zinc-500">
            <p>
              Ratings from IMDb&apos;s public datasets, under their non-commercial license. Information courtesy of IMDb (
              <a href="https://www.imdb.com" target="_blank" rel="noreferrer" className="underline">
                https://www.imdb.com
              </a>
              ). Used with permission.
            </p>
            <p>
              Posters and summaries from{" "}
              <a href="https://www.tvmaze.com" target="_blank" rel="noreferrer" className="underline">
                TVmaze
              </a>{" "}
              (
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                CC BY-SA
              </a>
              ).
            </p>
            <DataStamp />
            <p>
              <a
                href="https://github.com/JonyDLCS/heatseries"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4 fill-current">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Source code on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
