import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "./outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type OutfitPost = {
  id: string;
  user_id: string;
  caption: string | null;
  photo_url: string;
  created_at: string;
  profile: unknown;
};

type ProfileRecord = { username: string; display_name: string | null };
type OutfitItemLink = { post_id: string; closet_item_id: string };
type FitReport = {
  closet_item_id: string;
  size_label: string;
  fit: string;
  product: unknown;
};
type ProductRecord = { name: string; slug: string; brand: unknown };
type BrandRecord = { name: string };

const FIT_LABELS: Record<string, string> = {
  too_small: "Too small",
  snug: "Snug",
  just_right: "Just right",
  relaxed: "Relaxed",
  too_big: "Too big",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export default async function OutfitsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login?next=/outfits");
  }

  const params = await searchParams;
  const posted = first(params.posted) === "1";

  const { data: postData, error: postError } = await supabase
    .from("outfit_posts")
    .select("id, user_id, caption, photo_url, created_at, profile:profiles(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (postError) throw new Error("Could not load outfits.");
  const posts = (postData ?? []) as OutfitPost[];
  const postIds = posts.map((post) => post.id);

  let links: OutfitItemLink[] = [];
  if (postIds.length > 0) {
    const { data, error } = await supabase
      .from("outfit_post_items")
      .select("post_id, closet_item_id")
      .in("post_id", postIds);
    if (error) throw new Error("Could not load outfit tags.");
    links = (data ?? []) as OutfitItemLink[];
  }

  const closetItemIds = [...new Set(links.map((link) => link.closet_item_id))];
  let reports: FitReport[] = [];
  if (closetItemIds.length > 0) {
    const { data, error } = await supabase
      .from("fit_reports")
      .select("closet_item_id, size_label, fit, product:products(name, slug, brand:brands(name))")
      .in("closet_item_id", closetItemIds);
    if (error) throw new Error("Could not load outfit fit evidence.");
    reports = (data ?? []) as FitReport[];
  }

  const reportByClosetItem = new Map(reports.map((report) => [report.closet_item_id, report]));
  const itemIdsByPost = new Map<string, string[]>();
  for (const link of links) {
    const ids = itemIdsByPost.get(link.post_id) ?? [];
    ids.push(link.closet_item_id);
    itemIdsByPost.set(link.post_id, ids);
  }

  const signedPhotoByPost = new Map<string, string>();
  await Promise.all(
    posts.map(async (post) => {
      const { data } = await supabase.storage
        .from("outfit-photos")
        .createSignedUrl(post.photo_url, 60 * 60);
      if (data?.signedUrl) signedPhotoByPost.set(post.id, data.signedUrl);
    }),
  );

  return (
    <main className="pageShell">
      <div className="pageTitle rowTitle">
        <div>
          <span className="eyebrow">OUTFITS</span>
          <h1>Real clothes on real Fit Profiles.</h1>
          <p>
            Member outfits connect what people wear back to exact products, purchased sizes, and reported fit—without exposing body measurements.
          </p>
        </div>
        <Link className="primaryButton" href="/outfits/new">+ Post outfit</Link>
      </div>

      {posted ? <div className="authMessage">Outfit posted.</div> : null}

      {posts.length > 0 ? (
        <div className={styles.feed}>
          {posts.map((post) => {
            const profile = one<ProfileRecord>(post.profile);
            const name = profile?.display_name?.trim() || profile?.username || "LikeSized member";
            const signedPhoto = signedPhotoByPost.get(post.id);
            const taggedReports = (itemIdsByPost.get(post.id) ?? [])
              .map((id) => reportByClosetItem.get(id))
              .filter((report): report is FitReport => Boolean(report));

            return (
              <article className={styles.post} key={post.id}>
                <div className={styles.postHeader}>
                  <div className="avatar small">{name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    {profile?.username ? (
                      <Link className="textLink" href={`/people/${profile.username}`}>{name}</Link>
                    ) : (
                      <strong>{name}</strong>
                    )}
                    <span className="muted">{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                {signedPhoto ? (
                  <img className={styles.photo} src={signedPhoto} alt={post.caption ? `Outfit posted by ${name}` : `Outfit by ${name}`} />
                ) : (
                  <div className={styles.photoFallback}>Photo unavailable</div>
                )}

                <div className={styles.body}>
                  {post.caption ? <p>{post.caption}</p> : null}
                  <div className={styles.tags}>
                    {taggedReports.map((report) => {
                      const product = one<ProductRecord>(report.product);
                      const brand = one<BrandRecord>(product?.brand);
                      return product ? (
                        <Link className={styles.tag} href={`/item/${product.slug}`} key={report.closet_item_id}>
                          <strong>{brand?.name || "Brand"} · {product.name}</strong>
                          <span>Size {report.size_label} · {FIT_LABELS[report.fit] || report.fit}</span>
                        </Link>
                      ) : null;
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="emptyState">
          <span className="eyebrow">NO OUTFITS YET</span>
          <h2>Be the first to connect a look to real fit evidence.</h2>
          <p>Post a photo and tag the garments you actually own and wear.</p>
          <Link className="primaryButton" href="/outfits/new">Post an outfit →</Link>
        </div>
      )}
    </main>
  );
}
