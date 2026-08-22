import { NextResponse } from "next/server";
import { enabledExternalCatalogProviders, lookupUpcItemDb, searchChannel3CatalogCandidates, type ExternalCatalogCandidate } from "@/lib/catalog-import";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
function clean(value: string) { return value.trim().replace(/\s+/g, " ").slice(0, 180); }
type LocalSearchRow = { id: string; name: string; brand_name: string; slug: string; category: string; total_count: number };

export async function GET(request: Request) {
  const query = clean(new URL(request.url).searchParams.get("q") ?? "");
  const searchRetailCatalog = new URL(request.url).searchParams.get("retail") === "1";
  if (query.length < 3) return NextResponse.json({ local: [], external: [] });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: local, error } = await supabase.rpc("search_catalog_products", { p_query: query, p_result_limit: 8 });
  if (error) return NextResponse.json({ error: "Catalog search is temporarily unavailable." }, { status: 500 });
  if (!searchRetailCatalog) {
    const localRows = (local ?? []) as LocalSearchRow[];
    const ids = localRows.map((item) => item.id);
    const { data: catalogRows, error: catalogError } = await supabase.from("products").select("id,name,garment_type_key,manufacturer_style_number,brand:brands(name)").in("id", ids);
    if (catalogError) return NextResponse.json({ error: "Catalog search is temporarily unavailable." }, { status: 500 });
    const byId = new Map((catalogRows ?? []).map((item) => [item.id, item]));
    const detailedLocal = localRows.flatMap((item) => {
      const product = byId.get(item.id);
      const joinedBrand = product?.brand as unknown;
      const brand = Array.isArray(joinedBrand) ? joinedBrand[0] : joinedBrand;
      const brandName = brand && typeof brand === "object" && "name" in brand && typeof brand.name === "string" ? brand.name : null;
      return product && brandName ? [{ id: product.id, name: product.name, brand_name: brandName, garment_type_key: product.garment_type_key, manufacturer_style_number: product.manufacturer_style_number }] : [];
    });
    return NextResponse.json({ local: detailedLocal, external: [] });
  }
  const external: ExternalCatalogCandidate[] = [];
  let externalFailure = false;
  for (const provider of enabledExternalCatalogProviders(query)) {
    const { data: reservation, error: reservationError } = await supabase.rpc("reserve_catalog_import_request", { p_provider_key: provider });
    if (reservationError || !(reservation as { allowed?: boolean } | null)?.allowed) continue;
    try { external.push(...(provider === "channel3_catalog" ? await searchChannel3CatalogCandidates(query, userId) : await lookupUpcItemDb(query))); } catch { externalFailure = true; }
  }
  if (!external.length && externalFailure) return NextResponse.json({ error: "Item search could not load right now. Please try again." }, { status: 502 });
  return NextResponse.json({ local: local ?? [], external: external.slice(0, 8) });
}
