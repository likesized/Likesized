import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addToWishLocker,
  likeProduct,
  removeFromWishLocker,
  requestEvidenceNotification,
  cancelEvidenceNotification,
  unlikeProduct,
} from "@/app/likelocker/actions";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import { ReportContentForm } from "@/components/ReportContentForm";
import { ProductMiniBrowser } from "@/components/ProductMiniBrowser";
import styles from "./explore.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  garment_type_key: string | null;
  image_url: string | null;
  brand: unknown;
};
type Brand = { name: string };
type BrandOption = { id: string; name: string };
type GarmentType = { key: string; label: string; category: string };
type StyleOption = { option_key: string; label: string };
type Outfit = {
  id: string;
  user_id: string;
  caption: string | null;
  photo_url: string;
  created_at: string;
  profile: unknown;
};
type Profile = { username: string; display_name: string | null };
type Match = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  match_score: number;
};
type Evidence = {
  user_id: string;
  original_size_label: string;
  fit: string;
  historical_match_score: number;
};
type Person = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};
const LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  other: "Other",
};
function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
function one<T>(v: unknown): T | null {
  return Array.isArray(v)
    ? ((v[0] as T | undefined) ?? null)
    : ((v as T | null) ?? null);
}
function clean(v: string | undefined) {
  return (v ?? "").trim().replace(/%/g, "").replace(/\s+/g, " ").slice(0, 80);
}
function tier(score: number) {
  if (score >= 90) return "Exceptional fit evidence";
  if (score >= 85) return "Strong fit evidence";
  if (score >= 80) return "Good fit evidence";
  return "Useful fit evidence";
}
function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProductCard({ product, score, evidence, wearer, reportCount, liked, wished, watching, returnTo }: { product: Product; score: number; evidence?: Evidence; wearer?: Person; reportCount: number; liked: boolean; wished: boolean; watching: boolean; returnTo: string }) {
  const brand = one<Brand>(product.brand);
  return <article className={styles.card}><ProductMiniBrowser href={`/item/${product.slug}`} label={`${brand?.name??""} ${product.name}`.trim()}><span className={styles.imageLink}>{product.image_url?<img src={product.image_url} alt={`${brand?.name??""} ${product.name}`.trim()}/>:<span className={styles.fallback}>{product.name.replace(/[^A-Za-z0-9]/g,"").slice(0,2).toUpperCase()||"LS"}</span>}</span></ProductMiniBrowser><div className={styles.body}><span className="muted">{brand?.name||"Brand"} · {LABELS[product.category]||"Garment"}</span><ProductMiniBrowser href={`/item/${product.slug}`} label={`${brand?.name??""} ${product.name}`.trim()}><span className={styles.title}>{product.name}</span></ProductMiniBrowser>{score?<div><strong>{score}% historical Match</strong><span className="muted">{tier(score)} · {reportCount} Fit {reportCount===1?"Report":"Reports"}</span></div>:<span className="muted">Fit evidence is still growing.</span>}{evidence&&wearer?<p className={styles.evidence}><Link href={`/people/${wearer.username}`}>{wearer.display_name?.trim()||wearer.username}</Link> wore size {evidence.original_size_label} · {label(evidence.fit)}</p>:null}<div className={styles.actions}><form action={liked?unlikeProduct:likeProduct}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={liked}>{liked?"♥ Liked":"♡ Like"}</button></form><form action={wished?removeFromWishLocker:addToWishLocker}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={wished}>{wished?"In Wish Locker":"+ Wish Locker"}</button></form>{score<75?<form action={watching?cancelEvidenceNotification:requestEvidenceNotification}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" aria-pressed={watching}>{watching?"Notification on":"Notify me"}</button></form>:null}</div></div></article>;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const view = first(params.view) === "outfits" ? "outfits" : "garments";
  const scope = first(params.scope) === "all" ? "all" : "matches";
  const q = clean(first(params.q));
  const category = clean(first(params.category));
  const garmentType = clean(first(params.type));
  const style = clean(first(params.style));
  const brandId = clean(first(params.brand));
  const model = clean(first(params.model));
  const color = clean(first(params.color));
  const resultLimit = Math.min(
    96,
    Math.max(24, Number(first(params.limit)) || 24),
  );
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub;
  if (claimsError || !viewerId) redirect("/login?next=/explore");
  const [
    { data: profile },
    { data: fitProfile },
    { data: matchData, error: matchError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username")
      .eq("id", viewerId)
      .maybeSingle(),
    supabase
      .from("fit_profiles")
      .select("completed_at")
      .eq("user_id", viewerId)
      .maybeSingle(),
    supabase.rpc("get_fit_matches", {
      p_match_category: "overall",
      p_result_limit: 100,
    }),
  ]);
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");
  if (matchError) throw new Error("Could not load Explore matches.");
  const matches = (matchData ?? []) as Match[];
  const matchByUser = new Map(
    matches.map((row) => [row.user_id, row.match_score]),
  );
  let products: Product[] = [];
  let people: Person[] = [];
  const [garmentTypeResult, brandResult, styleResult, colorResult] =
    await Promise.all([
      supabase
        .from("garment_types")
        .select("key,label,category")
        .eq("active", true)
        .order("sort_order"),
      supabase.from("brands").select("id,name").order("name"),
      supabase
        .from("garment_attribute_options")
        .select("option_key,label")
        .eq("attribute_key", "fit_cut")
        .order("sort_order"),
      supabase
        .from("product_variants")
        .select("color_label")
        .not("color_label", "is", null)
        .limit(500),
    ]);
  const garmentTypes = (garmentTypeResult.data ?? []) as GarmentType[];
  const brands = (brandResult.data ?? []) as BrandOption[];
  const styleOptions = (styleResult.data ?? []) as StyleOption[];
  const colors = [
    ...new Set(
      (colorResult.data ?? [])
        .map((row) => row.color_label?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  let strictProductIds: string[] | null = null;
  if (style) {
    const { data } = await supabase
      .from("product_attribute_values")
      .select("product_id")
      .eq("attribute_key", "fit_cut")
      .eq("option_key", style);
    strictProductIds = (data ?? []).map((row) => row.product_id);
  }
  if (color) {
    const { data } = await supabase
      .from("product_variants")
      .select("product_id")
      .ilike("color_label", color);
    const colorIds = new Set((data ?? []).map((row) => row.product_id));
    strictProductIds = strictProductIds
      ? strictProductIds.filter((id) => colorIds.has(id))
      : [...colorIds];
  }
  if (view === "garments") {
    if (q) {
      const { data, error } = await supabase.rpc("search_catalog_products", {
        p_query: q,
        p_result_limit: resultLimit,
      });
      if (error) throw new Error("Could not search garments.");
      const ids = (data ?? []).map((row: { id: string }) => row.id);
      if (ids.length && (!strictProductIds || strictProductIds.length)) {
        let productQuery = supabase
          .from("products")
          .select(
            "id,name,slug,category,garment_type_key,image_url,brand:brands(name)",
          )
          .in("id", ids);
        if (strictProductIds) productQuery = productQuery.in("id", strictProductIds);
        if (category) productQuery = productQuery.eq("category", category);
        if (garmentType) productQuery = productQuery.eq("garment_type_key", garmentType);
        if (brandId) productQuery = productQuery.eq("brand_id", brandId);
        if (model) productQuery = productQuery.ilike("name", `%${model}%`);
        const result = await productQuery.limit(resultLimit);
        if (result.error) throw new Error("Could not load garments.");
        products = (result.data ?? []) as Product[];
      }
    } else {
      let query = supabase
        .from("products")
        .select(
          "id,name,slug,category,garment_type_key,image_url,brand:brands(name)",
        )
        .neq("catalog_status", "rejected")
        .order("created_at", { ascending: false })
        .limit(resultLimit);
      if (category) query = query.eq("category", category);
      if (garmentType) query = query.eq("garment_type_key", garmentType);
      if (brandId) query = query.eq("brand_id", brandId);
      if (model) query = query.ilike("name", `%${model}%`);
      if (strictProductIds) {
        if (!strictProductIds.length) query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        else query = query.in("id", strictProductIds);
      }
      const result = await query;
      if (result.error) throw new Error("Could not load garments.");
      products = (result.data ?? []) as Product[];
    }
  }
  if (q) {
    const { data } = await supabase.rpc("search_members", {
      p_query: q,
      p_result_limit: 8,
    });
    people = (data ?? []) as Person[];
  }
  const scores = new Map<string, number>();
  const bestEvidence = new Map<string, Evidence>();
  const reportCounts = new Map<string, number>();
  if (view === "garments" && products.length) {
    await Promise.all(
      products.map(async (product) => {
        const { data } = await supabase.rpc("get_product_evidence_candidates", {
          p_product_id: product.id,
          p_variant_id: null,
          p_result_limit: 40,
        });
        const candidates = (data ?? []) as Evidence[];
        const best = Math.max(
          ...candidates.map(
            (row) => row.historical_match_score,
          ),
          0,
        );
        scores.set(product.id, best);
        reportCounts.set(product.id, candidates.length);
        const strongest = candidates.reduce<Evidence | undefined>(
          (current, row) =>
            !current || row.historical_match_score > current.historical_match_score
              ? row
              : current,
          undefined,
        );
        if (strongest) bestEvidence.set(product.id, strongest);
      }),
    );
    if (scope === "matches")
      products = products.filter(
        (product) => (scores.get(product.id) ?? 0) >= 75,
      );
    products.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  }
  const evidenceUserIds = [...new Set([...bestEvidence.values()].map((row) => row.user_id))];
  const { data: evidenceProfiles } = evidenceUserIds.length
    ? await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .in("id", evidenceUserIds)
    : { data: [] };
  const evidencePeople = new Map(
    ((evidenceProfiles ?? []) as Person[]).map((person) => [person.id, person]),
  );
  let outfits: Outfit[] = [];
  if (view === "outfits") {
    let query = supabase
      .from("outfit_posts")
      .select(
        "id,user_id,caption,photo_url,created_at,profile:profiles(username,display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(resultLimit);
    const result = await query;
    if (result.error) throw new Error("Could not load outfits.");
    outfits = (result.data ?? []) as Outfit[];
    if (scope === "matches")
      outfits = outfits.filter(
        (post) => (matchByUser.get(post.user_id) ?? 0) >= 75,
      );
    if (q)
      outfits = outfits.filter((post) => {
        const p = one<Profile>(post.profile);
        return `${post.caption ?? ""} ${p?.username ?? ""} ${p?.display_name ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase());
      });
    outfits.sort(
      (a, b) =>
        (matchByUser.get(b.user_id) ?? 0) - (matchByUser.get(a.user_id) ?? 0),
    );
  }
  const [{ data: likedData }, { data: wishedData }, { data: watchedData }] = await Promise.all([
    supabase.from("product_likes").select("product_id").eq("user_id", viewerId),
    supabase
      .from("wish_locker_items")
      .select("product_id")
      .eq("user_id", viewerId),
    supabase
      .from("product_evidence_notifications")
      .select("product_id")
      .eq("user_id", viewerId),
  ]);
  const liked = new Set((likedData ?? []).map((row) => row.product_id));
  const wished = new Set((wishedData ?? []).map((row) => row.product_id));
  const watched = new Set((watchedData ?? []).map((row) => row.product_id));
  const signed = new Map<string, string>();
  await Promise.all(
    outfits.map(async (post) => {
      const feedPath = outfitFeedPhotoPath(post.photo_url);
      let { data } = await supabase.storage
        .from("outfit-photos")
        .createSignedUrl(feedPath, 1800);
      if (!data?.signedUrl && feedPath !== post.photo_url)
        ({ data } = await supabase.storage
          .from("outfit-photos")
          .createSignedUrl(post.photo_url, 1800));
      if (data?.signedUrl) signed.set(post.id, data.signedUrl);
    }),
  );
  const filterQuery = new URLSearchParams();
  filterQuery.set("view", view);
  filterQuery.set("scope", scope);
  if (category) filterQuery.set("category", category);
  if (garmentType) filterQuery.set("type", garmentType);
  if (style) filterQuery.set("style", style);
  if (brandId) filterQuery.set("brand", brandId);
  if (model) filterQuery.set("model", model);
  if (color) filterQuery.set("color", color);
  if (q) filterQuery.set("q", q);
  if (resultLimit > 24) filterQuery.set("limit", String(resultLimit));
  const base = `/explore?${filterQuery.toString()}`;
  const nextLimit = Math.min(96, resultLimit + 24);
  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">EXPLORE</span>
        <h1>Discover clothes through real fit evidence.</h1>
        <p>
          Start with garments and outfits backed by members whose fit data is
          most relevant to you. Switch to All whenever you want the wider
          catalog.
        </p>
      </div>
      <form className={styles.search} action="/explore">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="scope" value={scope} />
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search garments, outfits, or people"
          maxLength={80}
        />
        <button className="primaryButton">Search</button>
      </form>
      <div className={styles.controls}>
        <nav className="filterBar" aria-label="Explore content">
          <Link
            className={`filter${view === "garments" ? " active" : ""}`}
            href="/explore?view=garments&scope=matches"
          >
            Garments
          </Link>
          <Link
            className={`filter${view === "outfits" ? " active" : ""}`}
            href="/explore?view=outfits&scope=matches"
          >
            Outfits
          </Link>
        </nav>
        <nav className="filterBar" aria-label="Explore scope">
          <Link
            className={`filter${scope === "matches" ? " active" : ""}`}
            href={`/explore?view=${view}&scope=matches`}
          >
            My Fit Matches
          </Link>
          <Link
            className={`filter${scope === "all" ? " active" : ""}`}
            href={`/explore?view=${view}&scope=all`}
          >
            All
          </Link>
        </nav>
      </div>
      {view === "garments" && !q ? (
        <nav className={styles.categories} aria-label="Garment categories">
          <Link
            className={!category ? styles.activeCategory : styles.category}
            href={`/explore?view=garments&scope=${scope}`}
          >
            All garments
          </Link>
          {Object.entries(LABELS).map(([key, label]) => (
            <Link
              key={key}
              className={
                category === key ? styles.activeCategory : styles.category
              }
              href={`/explore?view=garments&scope=${scope}&category=${key}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
      {view === "garments" ? (
        <details className={styles.filters} open={Boolean(garmentType || style || brandId || model || color)}>
          <summary>Filter garments</summary>
          <form action="/explore">
            <input type="hidden" name="view" value="garments" />
            <input type="hidden" name="scope" value={scope} />
            {category ? <input type="hidden" name="category" value={category} /> : null}
            {q ? <input type="hidden" name="q" value={q} /> : null}
            <label>Type<select name="type" defaultValue={garmentType}><option value="">All types</option>{garmentTypes.filter((item) => !category || item.category === category).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
            <label>Style<select name="style" defaultValue={style}><option value="">All styles</option>{styleOptions.map((item) => <option key={item.option_key} value={item.option_key}>{item.label}</option>)}</select></label>
            <label>Brand<select name="brand" defaultValue={brandId}><option value="">All brands</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label>Model<input name="model" defaultValue={model} placeholder="Exact model words" /></label>
            <label>Color<select name="color" defaultValue={color}><option value="">All colors</option>{colors.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <button className="primaryButton">Apply filters</button>
            <Link className="secondaryButton" href={`/explore?view=garments&scope=${scope}`}>Clear</Link>
          </form>
          <p>Filters are strict. Explore will never silently broaden your choices.</p>
        </details>
      ) : null}
      {scope === "matches" ? (
        <p className={styles.explainer}>
          My Fit Matches shows 75%+ evidence first. Match % is relevance—not a
          guarantee that a garment will fit.
        </p>
      ) : null}
      {view === "garments" && products.length ? (
        <><div className={styles.carousel} aria-label="Top eight Explore results">{products.slice(0,8).map(product=>{const evidence=bestEvidence.get(product.id);return <ProductCard key={product.id} product={product} score={scores.get(product.id)??0} evidence={evidence} wearer={evidence?evidencePeople.get(evidence.user_id):undefined} reportCount={reportCounts.get(product.id)??0} liked={liked.has(product.id)} wished={wished.has(product.id)} watching={watched.has(product.id)} returnTo={base}/>})}</div>{products.length>8?<div className={styles.grid}>{products.slice(8).map(product=>{const evidence=bestEvidence.get(product.id);return <ProductCard key={product.id} product={product} score={scores.get(product.id)??0} evidence={evidence} wearer={evidence?evidencePeople.get(evidence.user_id):undefined} reportCount={reportCounts.get(product.id)??0} liked={liked.has(product.id)} wished={wished.has(product.id)} watching={watched.has(product.id)} returnTo={base}/>})}</div>:null}</>
      ) : null}
      {view === "outfits" && outfits.length ? (
        <div className={styles.grid}>
          {outfits.map((post) => {
            const p = one<Profile>(post.profile);
            const name =
              p?.display_name?.trim() || p?.username || "LikeSized member";
            const score = matchByUser.get(post.user_id);
            return (
              <article className={styles.card} key={post.id}>
                {signed.get(post.id) ? (
                  <img
                    className={styles.outfit}
                    src={signed.get(post.id)}
                    alt={`Outfit by ${name}`}
                  />
                ) : (
                  <div className={styles.outfitFallback}>
                    Outfit photo unavailable
                  </div>
                )}
                <div className={styles.body}>
                  <span className="muted">
                    {score ? `${score}% Overall Match` : "LikeSized member"}
                  </span>
                  <strong>{name}</strong>
                  {post.caption ? <p>{post.caption}</p> : null}
                  {p?.username ? (
                    <Link className="textLink" href={`/people/${p.username}`}>
                      View wearer →
                    </Link>
                  ) : null}
                  {post.user_id !== viewerId ? (
                    <ReportContentForm
                      targetType="outfit_post"
                      targetId={post.id}
                      returnTo={base}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
      {q && people.length ? (
        <section>
          <div className="sectionHeading">
            <div>
              <span className="eyebrow">PEOPLE</span>
              <h2>People matching “{q}”</h2>
            </div>
          </div>
          <div className={styles.people}>
            {people.map((person) => (
              <Link href={`/people/${person.username}`} key={person.id}>
                <strong>
                  {person.display_name?.trim() || person.username}
                </strong>
                <span>
                  @{person.username}
                  {typeof matchByUser.get(person.id) === "number"
                    ? ` · ${matchByUser.get(person.id)}% Overall Match`
                    : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {(view === "garments" && !products.length) ||
      (view === "outfits" && !outfits.length) ? (
        <div className="emptyState">
          <span className="eyebrow">MORE EVIDENCE NEEDED</span>
          <h2>
            {scope === "matches"
              ? "No 75%+ matches are available in this view yet."
              : "Nothing matches these filters yet."}
          </h2>
          <p>
            Try All, clear the search, or choose another category. Explore will
            grow automatically as members add real fit reports and outfits.
          </p>
          <Link
            className="secondaryButton"
            href={`/explore?view=${view}&scope=all`}
          >
            See all {view} →
          </Link>
        </div>
      ) : null}
      {resultLimit < 96 &&
      ((view === "garments" && products.length > 0) ||
        (view === "outfits" && outfits.length > 0)) ? (
        <div className={styles.more}>
          <Link
            className="secondaryButton"
            href={`${base.replace(/&limit=\d+/, "")}&limit=${nextLimit}`}
          >
            Keep Browsing · +24
          </Link>
        </div>
      ) : null}
    </main>
  );
}
