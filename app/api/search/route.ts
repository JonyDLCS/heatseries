import type { NextRequest } from "next/server";

import { hasDatabase, searchSeries } from "@/lib/db";

const MAX_QUERY = 100;

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (query.length > MAX_QUERY) {
    return Response.json({ error: "bad_request", results: [] }, { status: 400 });
  }
  if (!hasDatabase()) {
    return Response.json({ error: "no_database", results: [] }, { status: 503 });
  }

  try {
    return Response.json({ results: await searchSeries(query) });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "server_error", results: [] }, { status: 500 });
  }
}
