import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_QUERIES = 5;
const MAX_QUERY_LENGTH = 180;

function safeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

async function runSearch(query: string, apiKey: string) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("device", "desktop");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json().catch(() => ({ error: "SerpAPI returned a non-JSON response." }));
  return {
    query,
    ok: response.ok,
    status: response.status,
    response: body,
  };
}

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") return new NextResponse(null, { status: 404 });

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SERPAPI_API_KEY is not available in this Preview deployment." }, { status: 503 });

  const url = new URL(request.url);
  const queries = url.searchParams.getAll("q").map(safeQuery).filter(Boolean);
  if (!queries.length || queries.length > MAX_QUERIES) {
    return NextResponse.json({ error: `Provide between 1 and ${MAX_QUERIES} q parameters.` }, { status: 400 });
  }

  const uniqueQueries = [...new Set(queries)];
  const results = [];
  for (const query of uniqueQueries) results.push(await runSearch(query, apiKey));

  return NextResponse.json(
    { engine: "google_shopping", count: results.length, results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
