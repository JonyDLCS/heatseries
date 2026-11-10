import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

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
          </div>
        </footer>
      </body>
    </html>
  );
}
