import { NextResponse } from "next/server";
import { EXPLORE_FIXTURE_OUTFITS, EXPLORE_FIXTURE_PEOPLE, EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { createClient } from "@/lib/supabase/server";

function includes(query: string, ...values: Array<string | null | undefined>) { return values.join(" ").toLowerCase().includes(query.toLowerCase()); }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 5));
  if (!q) return NextResponse.json({ garments: { total: 0, items: [] }, outfits: { total: 0, items: [] }, people: { total: 0, items: [] } });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [garmentResult, outfitResult, peopleResult] = await Promise.all([
    supabase.rpc("search_catalog_products", { p_query: q, p_result_limit: limit }),
    supabase.rpc("search_outfits", { p_query: q, p_result_limit: limit }),
    supabase.rpc("search_members", { p_query: q, p_result_limit: limit }),
  ]);
  if (garmentResult.error || peopleResult.error) return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 500 });

  let outfitRows = outfitResult.data ?? [];
  if (outfitResult.error) {
    const fallback = await supabase.from("outfit_posts").select("id,user_id,caption,photo_url,created_at,profile:profiles(username,display_name)").order("created_at", { ascending: false }).limit(200);
    if (fallback.error) return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 500 });
    const matching = (fallback.data ?? []).filter((item) => {
      const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile;
      return includes(q, item.caption, profile?.username, profile?.display_name);
    });
    outfitRows = matching.map((item) => {
      const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile;
      return { ...item, username: profile?.username ?? "", display_name: profile?.display_name ?? null, total_count: matching.length };
    });
  }

  let garments = (garmentResult.data ?? []).map((item: { id:string; name:string; brand_name:string; slug:string }) => ({ id: item.id, title: item.name, meta: item.brand_name, href: `/item/${item.slug}` }));
  let outfits = outfitRows.slice(0,limit).map((item: { id:string; caption:string|null; display_name:string|null; username:string }) => ({ id: item.id, title: item.caption || "Outfit", meta: item.display_name || `@${item.username}`, href: `/circle?post=${item.id}` }));
  let people = (peopleResult.data ?? []).map((item: { id:string; display_name:string|null; username:string }) => ({ id: item.id, title: item.display_name || item.username, meta: `@${item.username}`, href: `/people/${item.username}` }));
  let garmentTotal = Number(garmentResult.data?.[0]?.total_count ?? 0);
  let outfitTotal = Number(outfitRows?.[0]?.total_count ?? outfitRows.length);
  let peopleTotal = Number(peopleResult.data?.[0]?.total_count ?? 0);

  if (allowExploreFixtures(url.searchParams.get("fixtures") === "1")) {
    const fixtureGarments = EXPLORE_FIXTURE_PRODUCTS.filter((item) => includes(q, item.name, item.brand.name, item.garment_type_key)).map((item) => ({ id: item.id, title: item.name, meta: `${item.brand.name} · Test garment`, href: `/explore/preview?kind=garment&id=${item.id}` }));
    const fixtureOutfits = EXPLORE_FIXTURE_OUTFITS.filter((item) => includes(q, item.caption, item.profile.display_name, item.profile.username)).map((item) => ({ id: item.id, title: item.caption, meta: `${item.profile.display_name} · Test outfit`, href: `/explore/preview?kind=outfit&id=${item.id}` }));
    const fixturePeople = EXPLORE_FIXTURE_PEOPLE.filter((item) => includes(q, item.display_name, item.username)).map((item) => ({ id: item.id, title: item.display_name, meta: `@${item.username} · Test wearer`, href: `/explore/preview?kind=person&id=${item.id}` }));
    garmentTotal += fixtureGarments.length; outfitTotal += fixtureOutfits.length; peopleTotal += fixturePeople.length;
    garments = [...fixtureGarments, ...garments].slice(0, limit);
    outfits = [...fixtureOutfits, ...outfits].slice(0, limit);
    people = [...fixturePeople, ...people].slice(0, limit);
  }

  return NextResponse.json({ garments: { total: garmentTotal, items: garments }, outfits: { total: outfitTotal, items: outfits }, people: { total: peopleTotal, items: people } });
}
