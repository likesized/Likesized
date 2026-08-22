import { notFound } from "next/navigation";
import { EXPLORE_FIXTURE_OUTFITS, EXPLORE_FIXTURE_PEOPLE, EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { GARMENT_TYPE_BY_KEY } from "@/lib/garment-taxonomy";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function words(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default async function ExploreFixtureDetail({ searchParams }: { searchParams: SearchParams }) {
  if (!allowExploreFixtures(true)) notFound();
  const params = await searchParams;
  const kind = first(params.kind);
  const id = first(params.id);
  const product = kind === "garment" ? EXPLORE_FIXTURE_PRODUCTS.find((item) => item.id === id) : undefined;
  const outfit = kind === "outfit" ? EXPLORE_FIXTURE_OUTFITS.find((item) => item.id === id) : undefined;
  const person = kind === "person" ? EXPLORE_FIXTURE_PEOPLE.find((item) => item.id === id) : undefined;
  if (!product && !outfit && !person) notFound();
  return <main className="pageShell"><div className="authMessage"><b>Temporary preview data</b> — this does not exist in Supabase and will be removed before production.</div>{product ? <><div className="pageTitle"><span className="eyebrow">TEST GARMENT</span><h1>{product.brand.name} · {product.name}</h1><p>{GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label} · {words(product.color_family_key)} · Size {product.size}</p></div><section className="infoCard"><h2>Controlled item details</h2>{Object.entries(product.attributes).map(([key,value]) => <p key={key}><b>{words(key)}:</b> {words(value)}</p>)}<p><b>Test Fit Result:</b> {words(product.fit)}</p><p><b>Internal test trust state:</b> {words(product.catalog_status)}</p></section></> : null}{outfit ? <><div className="pageTitle"><span className="eyebrow">TEST OUTFIT</span><h1>{outfit.caption}</h1><p>Shared by {outfit.profile.display_name}.</p></div><div className="emptyState"><h2>Outfit photo preview</h2><p>This labeled placeholder exercises outfit search, filtering, and selection without writing a fake photo to storage.</p></div></> : null}{person ? <><div className="pageTitle"><span className="eyebrow">TEST WEARER</span><h1>{person.display_name}</h1><p>@{person.username}</p></div><div className="infoCard"><p>This temporary wearer exists only in the owner-review preview.</p></div></> : null}</main>;
}
