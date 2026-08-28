import { notFound } from "next/navigation";
import { MatchPercentageBadge } from "@/components/MatchPercentageBadge";
import { TaggedFituitionCard } from "@/components/TaggedFituitionCard";
import { EXPLORE_FIXTURE_OUTFITS, EXPLORE_FIXTURE_PEOPLE, EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { FITUITION_REVIEW_FIXTURES, MATCH_BADGE_REVIEW_SCORES } from "@/lib/fituition-review-fixtures";
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
  const fituitionFixtures = kind === "fituition" ? (id ? FITUITION_REVIEW_FIXTURES.filter((item) => item.id === id) : FITUITION_REVIEW_FIXTURES) : [];
  if (!product && !outfit && !person && !fituitionFixtures.length) notFound();
  return <main className="pageShell"><div className="authMessage"><b>Temporary preview data</b> — this does not exist in Supabase and cannot appear in production.</div>{product ? <><div className="pageTitle"><span className="eyebrow">TEST GARMENT</span><h1>{product.brand.name} · {product.name}</h1><p>{GARMENT_TYPE_BY_KEY.get(product.garment_type_key)?.label} · {words(product.color_family_key)} · Size {product.size}</p></div><section className="infoCard"><h2>Controlled item details</h2>{Object.entries(product.attributes).map(([key,value]) => <p key={key}><b>{words(key)}:</b> {words(value)}</p>)}<p><b>Test Fit Result:</b> {words(product.fit)}</p><p><b>Internal test trust state:</b> {words(product.catalog_status)}</p></section></> : null}{outfit ? <><div className="pageTitle"><span className="eyebrow">TEST OUTFIT</span><h1>{outfit.caption}</h1><p>Shared by {outfit.profile.display_name}.</p></div><div className="emptyState"><h2>Outfit photo preview</h2><p>This labeled placeholder exercises outfit search, filtering, and selection without writing a fake photo to storage.</p></div></> : null}{person ? <><div className="pageTitle"><span className="eyebrow">TEST WEARER</span><h1>{person.display_name}</h1><p>@{person.username}</p></div><div className="infoCard"><p>This temporary wearer exists only in the owner-review preview.</p></div></> : null}{fituitionFixtures.length ? <><div className="pageTitle"><span className="eyebrow">FITUITION OWNER REVIEW</span><h1>All four tagged-garment states</h1><p>The cards below use the same canonical FITuition component as the Outfit garment preview.</p></div><section className="infoCard"><h2>Universal Match percentage colors</h2><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>{MATCH_BADGE_REVIEW_SCORES.map((score)=><MatchPercentageBadge key={score} score={score} label="Body Match"/>)}</div></section><div style={{display:"grid",gap:18,marginTop:18}}>{fituitionFixtures.map((fixture)=><section className="infoCard" key={fixture.id}><span className="eyebrow">{fixture.title}</span><h2>{fixture.brand} · {fixture.item}</h2><p className="muted">{fixture.garment} · {fixture.variation}</p><div style={{marginTop:14}}><TaggedFituitionCard meta={fixture.meta} watchPrompt={<div><b>🔔 Notify me</b><span className="muted">FITuition will notify you when people close to your size post a Fit Report for this item.</span></div>}/></div></section>)}</div></> : null}</main>;
}
