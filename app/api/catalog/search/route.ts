import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clean(value: string, max = 180) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}
function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function normalizeIdentifier(value: string) {
  return value.trim().toUpperCase().replace(/[\s_.-]+/g, "");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LocalSearchRow = { id: string };
type AliasRow = { product_id: string; normalized_alias: string };
type SizeDefaultRow = { product_id: string; default_size_kind: string | null };
type BarcodeLookupRow = {
  match_kind: "product" | "candidate";
  product_id: string | null;
  candidate_id: string | null;
  brand_name: string;
  product_name: string;
  garment_type_key: string | null;
  image_url: string | null;
  identity_confidence: string;
};

type DetailedProduct = {
  id: string;
  name: string;
  brand: unknown;
  garment_type_key: string | null;
  manufacturer_style_number: string | null;
  market_segment: string;
  department_key: string | null;
  image_url: string | null;
  attributes: unknown;
  materials: unknown;
  identifiers: unknown;
  listings: unknown;
};

async function detailedProducts(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  if (!ids.length) return [];
  const [{ data, error }, { data: sizeDefaults, error: sizeDefaultError }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,garment_type_key,manufacturer_style_number,market_segment,department_key,image_url,brand:brands(name),attributes:product_attribute_values(attribute_key,option_key,source_status),materials:product_materials(material_key,percentage,source_status),identifiers:product_identifiers(identifier_type,original_value),listings:retailer_listings(product_url)")
      .in("id", ids)
      .neq("catalog_status", "rejected"),
    supabase.rpc("get_product_default_size_kinds", { p_product_ids: ids }),
  ]);
  if (error) throw error;
  if (sizeDefaultError) throw sizeDefaultError;
  const byId = new Map((data ?? []).map((item) => [item.id, item as DetailedProduct]));
  const sizeKindById = new Map(((sizeDefaults ?? []) as SizeDefaultRow[]).map((row) => [row.product_id, row.default_size_kind]));
  return ids.flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    const joinedBrand = product.brand;
    const brand = Array.isArray(joinedBrand) ? joinedBrand[0] : joinedBrand;
    const brandName = brand && typeof brand === "object" && "name" in brand && typeof brand.name === "string" ? brand.name : "";
    return brandName ? [{ ...product, default_size_kind: sizeKindById.get(id) ?? null, brand_name: brandName, brand: undefined }] : [];
  });
}

async function matchingProductAliasIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  normalizedQuery: string,
  productIds?: string[],
) {
  if (!normalizedQuery || (productIds && !productIds.length)) return [];
  let aliasQuery = supabase
    .from("product_aliases")
    .select("product_id,normalized_alias")
    .like("normalized_alias", `%${normalizedQuery}%`)
    .limit(50);
  if (productIds) aliasQuery = aliasQuery.in("product_id", productIds);
  const { data, error } = await aliasQuery;
  if (error) throw error;
  return ((data ?? []) as AliasRow[])
    .sort((a, b) => Number(b.normalized_alias === normalizedQuery) - Number(a.normalized_alias === normalizedQuery))
    .map((row) => row.product_id)
    .filter((id, index, all) => all.indexOf(id) === index);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q") ?? "");
  const brandQuery = clean(url.searchParams.get("brand") ?? "", 120);
  const barcode = normalizeIdentifier(url.searchParams.get("barcode") ?? "");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    if (barcode) {
      if (!/^\d{8}$|^\d{12,14}$/.test(barcode)) return NextResponse.json({ local: [] });
      const { data: matchData, error } = await supabase.rpc("lookup_barcode_catalog_match", { p_barcode: barcode });
      if (error) throw error;
      const match = (Array.isArray(matchData) ? matchData[0] : matchData) as BarcodeLookupRow | null;
      if (!match) return NextResponse.json({ local: [] });
      if (match.match_kind === "product" && match.product_id) {
        const local = await detailedProducts(supabase, [match.product_id]);
        return NextResponse.json({ local, barcode_match: match });
      }
      if (match.match_kind === "candidate" && match.candidate_id) {
        return NextResponse.json({ local: [], barcode_match: match });
      }
      return NextResponse.json({ local: [] });
    }

    if (brandQuery) {
      const normalizedBrand = normalizeSearchText(brandQuery);
      const { data: direct, error: brandError } = await supabase.from("brands").select("id").eq("normalized_name", normalizedBrand).maybeSingle();
      if (brandError) throw brandError;
      let brandId = direct?.id ?? null;
      if (!brandId) {
        const { data: alias, error: aliasError } = await supabase.from("brand_aliases").select("brand_id").eq("normalized_alias", normalizedBrand).maybeSingle();
        if (aliasError) throw aliasError;
        brandId = alias?.brand_id ?? null;
      }
      if (!brandId) return NextResponse.json({ local: [] });
      const { data: candidates, error: candidateError } = await supabase
        .from("products")
        .select("id,name")
        .eq("brand_id", brandId)
        .neq("catalog_status", "rejected")
        .order("name")
        .limit(100);
      if (candidateError) throw candidateError;
      const normalizedQuery = normalizeSearchText(query);
      const productIds = (candidates ?? []).map((item) => item.id);
      const aliasIds = await matchingProductAliasIds(supabase, normalizedQuery, productIds);
      const aliasSet = new Set(aliasIds);
      const ids = (candidates ?? [])
        .filter((item) => !normalizedQuery || normalizeSearchText(item.name).includes(normalizedQuery) || aliasSet.has(item.id))
        .sort((a, b) => Number(aliasSet.has(b.id)) - Number(aliasSet.has(a.id)) || a.name.localeCompare(b.name))
        .slice(0, 12)
        .map((item) => item.id);
      return NextResponse.json({ local: await detailedProducts(supabase, ids) });
    }

    if (query.length < 2) return NextResponse.json({ local: [] });
    const normalizedQuery = normalizeSearchText(query);
    const [{ data: ranked, error }, aliasIds] = await Promise.all([
      supabase.rpc("search_catalog_products", { p_query: query, p_result_limit: 8 }),
      matchingProductAliasIds(supabase, normalizedQuery),
    ]);
    if (error) throw error;
    const ids = [...aliasIds, ...((ranked ?? []) as LocalSearchRow[]).map((item) => item.id)]
      .filter((id, index, all) => all.indexOf(id) === index)
      .slice(0, 8);
    return NextResponse.json({ local: await detailedProducts(supabase, ids) });
  } catch {
    return NextResponse.json({ error: "LikeSized catalog search is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = await request.json() as { barcode?: unknown; product_id?: unknown; candidate_id?: unknown };
    const barcode = normalizeIdentifier(typeof body.barcode === "string" ? body.barcode : "");
    const productId = typeof body.product_id === "string" && UUID.test(body.product_id) ? body.product_id : null;
    const candidateId = typeof body.candidate_id === "string" && UUID.test(body.candidate_id) ? body.candidate_id : null;
    if (!/^\d{8}$|^\d{12,14}$/.test(barcode) || (productId === null) === (candidateId === null)) {
      return NextResponse.json({ error: "Invalid barcode confirmation." }, { status: 400 });
    }
    const { data: status, error } = await supabase.rpc("confirm_barcode_catalog_match", {
      p_barcode: barcode,
      p_product_id: productId,
      p_candidate_id: candidateId,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "That barcode match could not be confirmed." }, { status: 500 });
  }
}
