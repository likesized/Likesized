import { NextResponse } from "next/server";
import { enabledExternalCatalogProviders, lookupUpcItemDb, searchBraveCatalogCandidates, type ExternalCatalogCandidate } from "@/lib/catalog-import";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clean(value: string) { return value.trim().replace(/\s+/g, " ").slice(0, 180); }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q") ?? "");
  if (query.length < 3) return NextResponse.json({ local: [], external: [] });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: local, error } = await supabase.rpc("search_catalog_products", { p_query: query, p_result_limit: 8 });
  if (error) return NextResponse.json({ error: "Catalog search is temporarily unavailable." }, { status: 500 });

  const external: ExternalCatalogCandidate[] = [];
  for (const provider of enabledExternalCatalogProviders(query)) {
    const { data: reservation, error: reservationError } = await supabase.rpc("reserve_catalog_import_request", { p_provider_key: provider });
    if (reservationError || !(reservation as { allowed?: boolean } | null)?.allowed) continue;
    try {
      const candidates = provider === "brave_search" ? await searchBraveCatalogCandidates(query) : await lookupUpcItemDb(query);
      external.push(...candidates);
    } catch {
      // Source failures are intentionally invisible to the member. Local results and
      // the next enabled source remain available.
    }
  }
  return NextResponse.json({ local: local ?? [], external: external.slice(0, 8) });
}
