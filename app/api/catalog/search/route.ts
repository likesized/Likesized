import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 180);
}

type LocalSearchRow = { id: string; name: string; brand_name: string };

export async function GET(request: Request) {
  const query = clean(new URL(request.url).searchParams.get("q") ?? "");
  if (query.length < 2) return NextResponse.json({ local: [] });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: ranked, error } = await supabase.rpc("search_catalog_products", { p_query: query, p_result_limit: 8 });
  if (error) return NextResponse.json({ error: "LikeSized catalog search is temporarily unavailable." }, { status: 500 });

  const ids = ((ranked ?? []) as LocalSearchRow[]).map((item) => item.id);
  if (!ids.length) return NextResponse.json({ local: [] });

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,garment_type_key,manufacturer_style_number,market_segment,department_key,image_url,brand:brands(name),attributes:product_attribute_values(attribute_key,option_key,source_status),materials:product_materials(material_key,percentage,source_status),identifiers:product_identifiers(identifier_type,original_value),listings:retailer_listings(product_url)")
    .in("id", ids);
  if (productError) return NextResponse.json({ error: "LikeSized catalog search is temporarily unavailable." }, { status: 500 });

  const byId = new Map((products ?? []).map((item) => [item.id, item]));
  const local = ids.flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    const joinedBrand = product.brand as unknown;
    const brand = Array.isArray(joinedBrand) ? joinedBrand[0] : joinedBrand;
    const brandName = brand && typeof brand === "object" && "name" in brand && typeof brand.name === "string" ? brand.name : "";
    return brandName ? [{ ...product, brand_name: brandName, brand: undefined }] : [];
  });

  return NextResponse.json({ local });
}
