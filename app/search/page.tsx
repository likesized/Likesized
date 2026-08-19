import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/server";
import styles from "./search.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SearchType = "all" | "products" | "people";

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand_name: string | null;
};

type RecentProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: unknown;
};

type BrandRecord = { name: string };

type ProfileRecord = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type MatchRecord = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  match_score: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  dresses: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  other: "Other",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function searchType(value: string | undefined): SearchType {
  return value === "products" || value === "people" ? value : "all";
}

function cleanQuery(value: string | undefined) {
  return (value ?? "")
    .trim()
    .replace(/%/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = cleanQuery(first(params.q));
  const type = searchType(first(params.type));
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(`/login?next=${encodeURIComponent(q ? `/search?q=${q}` : "/search")}`);
  }

  const [{ data: profile }, { data: fitProfile }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
    supabase.from("fit_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile?.username || !fitProfile) {
    redirect("/onboarding");
  }

  const { data: matchData, error: matchError } = await supabase.rpc("get_fit_matches", {
    p_match_category: "overall",
    p_result_limit: 100,
  });

  if (matchError) throw new Error("Could not load Fit Match discovery.");
  const matches = (matchData ?? []) as MatchRecord[];
  const matchByUser = new Map(matches.map((row) => [row.user_id, row.match_score]));

  let products: ProductRecord[] = [];
  let people: ProfileRecord[] = [];

  if (!q) {
    if (type !== "people") {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, brand:brands(name)")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw new Error("Could not load product discovery.");
      products = ((data ?? []) as RecentProductRecord[]).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        brand_name: one<BrandRecord>(product.brand)?.name ?? null,
      }));
    }

    if (type !== "products") {
      people = matches.slice(0, 12).map((row) => ({
        id: row.user_id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      }));
    }
  } else {
    if (type !== "people") {
      const { data, error } = await supabase.rpc("search_catalog_products", {
        p_query: q,
        p_result_limit: 24,
      });
      if (error) throw new Error("Could not search products.");
      products = (data ?? []) as ProductRecord[];
    }

    if (type !== "products") {
      const { data, error } = await supabase.rpc("search_members", {
        p_query: q,
        p_result_limit: 24,
      });
      if (error) throw new Error("Could not search members.");
      people = (data ?? []) as ProfileRecord[];
    }
  }

  const hasResults = products.length > 0 || people.length > 0;
  const queryString = q ? `?q=${encodeURIComponent(q)}` : "";

  return (
    <main className="pageShell">
      <div className="pageTitle">
        <span className="eyebrow">SEARCH & DISCOVERY</span>
        <h1>Find the clothes—or the people—behind the fit data.</h1>
        <p>
          Search product or brand names, brand aliases, style numbers, SKU/UPC/barcodes and retailer IDs—or find members by username/display name. Exact measurements never appear in search.
        </p>
      </div>

      <form className={styles.searchForm} action="/search" method="get">
        <input name="q" type="search" defaultValue={q} maxLength={80} placeholder="Search Levi's, 541, SKU, UPC, alex_fit..." aria-label="Search products, brands, identifiers, or members" />
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        <button className="primaryButton" type="submit">Search</button>
      </form>

      <div className="filterBar">
        <Link className={`filter${type === "all" ? " active" : ""}`} href={`/search${queryString}`}>All</Link>
        <Link className={`filter${type === "products" ? " active" : ""}`} href={`/search?${q ? `q=${encodeURIComponent(q)}&` : ""}type=products`}>Products</Link>
        <Link className={`filter${type === "people" ? " active" : ""}`} href={`/search?${q ? `q=${encodeURIComponent(q)}&` : ""}type=people`}>People</Link>
      </div>

      {!q ? <div className="authMessage">Showing current product discovery and your closest Overall Fit Matches.</div> : null}

      {(type === "all" || type === "products") && products.length > 0 ? (
        <section className={styles.section}>
          <div className="sectionHeading">
            <div><span className="eyebrow">PRODUCTS</span><h2>{q ? `Results for “${q}”` : "Recently logged products"}</h2></div>
          </div>
          <div className={styles.productGrid}>
            {products.map((product) => (
              <Link className={styles.productCard} href={`/item/${product.slug}`} key={product.id}>
                <div className={styles.productMark}>{product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "LS"}</div>
                <span className="muted">{product.brand_name || "Brand"} · {CATEGORY_LABELS[product.category] || "Other"}</span>
                <strong>{product.name}</strong>
                <span className="textLink">View fit evidence →</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {(type === "all" || type === "people") && people.length > 0 ? (
        <section className={styles.section}>
          <div className="sectionHeading">
            <div><span className="eyebrow">PEOPLE</span><h2>{q ? `Members matching “${q}”` : "Closest Overall Fit Matches"}</h2></div>
          </div>
          <div className="cardGrid">
            {people.map((person) => (
              <MatchCard
                key={person.id}
                name={person.display_name?.trim() || person.username}
                handle={`@${person.username}`}
                style="Member"
                match={matchByUser.get(person.id)}
                secondary={typeof matchByUser.get(person.id) === "number" ? "Overall Fit Match" : "Member profile"}
                description="Open this member profile to see safe match scores and real garment fit evidence."
                href={`/people/${person.username}`}
                linkLabel="View profile →"
              />
            ))}
          </div>
        </section>
      ) : null}

      {q && !hasResults ? (
        <div className="emptyState">
          <span className="eyebrow">NO RESULTS</span>
          <h2>Nothing matched “{q}” yet.</h2>
          <p>LikeSized search grows with the real products and completed member profiles in the database.</p>
          <Link className="secondaryButton" href="/search">Clear search</Link>
        </div>
      ) : null}
    </main>
  );
}
