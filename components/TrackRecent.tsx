"use client";

import { useEffect } from "react";

import { addRecent, type RecentShow } from "@/lib/recent";

export function TrackRecent({ imdbID, title, year }: RecentShow) {
  useEffect(() => {
    addRecent({ imdbID, title, year });
  }, [imdbID, title, year]);

  return null;
}
