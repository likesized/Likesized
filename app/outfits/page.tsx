import Link from "next/link";
import { redirect } from "next/navigation";
import { likeOutfit, unlikeOutfit } from "@/app/outfits/actions";
import { OUTFIT_OCCASION_LABELS } from "@/lib/outfit-taxonomy";
import { createClient } from "@/lib/supabase/server";
import styles from "./outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type OutfitPost = {
  id: string;
  user_id: string;
  headline: string | null;
  photo_url: string | null;
  published_at: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  profile: unknown;
};
type DraftPost = { id: string; headline: string | null; updated_at: string };
type ProfileRecord = { username: string; display_name: string | null };
type OutfitLike = { post_id: string };
type OccasionRow = { post_id: string; occasion: string; sort_order: number };
type StyleRow = { post_id: string; display_tag: string; sort_order: number };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function OutfitsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;
  if (claimsError || !viewerId) redirect("/login?next=/outfits");

  const params = await searchParams;
  const feed = first(params.feed) === "following" ? "following" : "all";
  let followedIds: string[] = [];
  if (feed === "following") {
    const { data, error } = await supabase.from("follows").select("followed_id").eq("follower_id", viewerId);
    if (error) throw new Error("Could not load people you follow.");
    followedIds = (data ?? []).map((row) => row.followed_id);
  }

  let posts: OutfitPost[] = [];
  if (feed === "all" || followedIds.length) {
    let postQuery = supabase
      .from("outfit_posts")
      .select("id,user_id,headline,photo_url,published_at,created_at,like_count,comment_count,profile:profiles(username,display_name)")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (feed === "following") postQuery = postQuery.in("user_id", followedIds);
    const { data, error } = await postQuery;
    if (error) throw new Error("Could not load Outfits.");
    posts = (data ?? []) as OutfitPost[];
  }

  const [{ data: draftData, error: draftError }] = await Promise.all([
    supabase
      .from("outfit_posts")
      .select("id,headline,updated_at")
      .eq("user_id", viewerId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);
  if (draftError) throw new Error("Could not load your Outfit drafts.");
  const drafts = (draftData ?? []) as DraftPost[];

  const postIds = posts.map((post) => post.id);
  let viewerLikes: OutfitLike[] = [];
  let occasions: OccasionRow[] = [];
  let styleTags: StyleRow[] = [];
  if (postIds.length) {
    const [likeResult, occasionResult, styleResult] = await Promise.all([
      supabase.from("outfit_likes").select("post_id").eq("user_id", viewerId).in("post_id", postIds),
      supabase.from("outfit_occasions").select("post_id,occasion,sort_order").in("post_id", postIds).order("sort_order"),
      supabase.from("outfit_style_tags").select("post_id,display_tag,sort_order").in("post_id", postIds).order("sort_order"),
    ]);
    if (likeResult.error || occasionResult.error || styleResult.error) throw new Error("Could not load Outfit feed details.");
    viewerLikes = (likeResult.data ?? []) as OutfitLike[];
    occasions = (occasionResult.data ?? []) as OccasionRow[];
    styleTags = (styleResult.data ?? []) as StyleRow[];
  }
  const liked = new Set(viewerLikes.map((row) => row.post_id));
  const occasionByPost = new Map<string, OccasionRow[]>();
  for (const row of occasions) occasionByPost.set(row.post_id, [...(occasionByPost.get(row.post_id) ?? []), row]);
  const stylesByPost = new Map<string, StyleRow[]>();
  for (const row of styleTags) stylesByPost.set(row.post_id, [...(stylesByPost.get(row.post_id) ?? []), row]);

  const feedPhotoUrl = new Map<string, string>();
  for (const post of posts) {
    if (!post.photo_url) continue;
    const feedPath = post.photo_url.endsWith("/display.webp") ? post.photo_url.replace(/\/display\.webp$/, "/feed.webp") : post.photo_url;
    feedPhotoUrl.set(post.id, supabase.storage.from("outfit-photos").getPublicUrl(feedPath).data.publicUrl);
  }
  const returnTo = feed === "following" ? "/outfits?feed=following" : "/outfits";
  const deleted = first(params.deleted) === "1";
  const blocked = first(params.blocked) === "1";

  return <main className="pageShell">
    <div className="pageTitle rowTitle">
      <div><span className="eyebrow">OUTFITS</span><h1>Looks worth sharing.</h1><p>See how members put real Closet garments together, then open the Outfit for the full story and fit details.</p></div>
      <Link className="primaryButton" href="/outfits/new">+ New Outfit</Link>
    </div>
    {deleted ? <div className="authMessage">Outfit deleted.</div> : blocked ? <div className="authMessage">Member blocked.</div> : null}

    {drafts.length ? <section className={styles.draftStrip}>
      <div className={styles.sectionHeading}><div><span className="eyebrow">YOUR DRAFTS</span><h2>Pick up where you left off.</h2></div></div>
      <div className={styles.draftCards}>{drafts.map((draft) => <Link href={`/outfits/new?draft=${draft.id}`} key={draft.id}>
        <strong>{draft.headline?.trim() || "Untitled Outfit"}</strong><span>Updated {new Date(draft.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </Link>)}</div>
    </section> : null}

    <nav className={styles.feedTabs} aria-label="Outfit feed">
      <Link className={feed === "all" ? styles.activeTab : styles.tab} href="/outfits">All Outfits</Link>
      <Link className={feed === "following" ? styles.activeTab : styles.tab} href="/outfits?feed=following">Following</Link>
    </nav>

    {posts.length ? <div className={styles.feed}>{posts.map((post) => {
      const profile = one<ProfileRecord>(post.profile);
      const name = profile?.display_name?.trim() || profile?.username || "LikeSized member";
      const image = feedPhotoUrl.get(post.id);
      const postOccasions = occasionByPost.get(post.id) ?? [];
      const postStyles = stylesByPost.get(post.id) ?? [];
      const hasLiked = liked.has(post.id);
      return <article className={styles.post} key={post.id}>
        <div className={styles.postHeader}>
          <div className="avatar small">{name.slice(0, 1).toUpperCase()}</div>
          <div>{profile?.username ? <Link className="textLink" href={`/people/${profile.username}`}>{name}</Link> : <strong>{name}</strong>}<span className="muted">{new Date(post.published_at || post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
        </div>
        <Link className={styles.feedPhotoLink} href={`/outfits/${post.id}`} aria-label={`Open ${post.headline || "Outfit"}`}>
          {image ? <img className={styles.photo} src={image} alt={`Outfit by ${name}`} /> : <div className={styles.photoFallback}>Photo unavailable</div>}
        </Link>
        <div className={styles.body}>
          <div className={styles.pills}>{postOccasions.map((row) => <span key={row.occasion}>{OUTFIT_OCCASION_LABELS.get(row.occasion) ?? row.occasion}</span>)}</div>
          {postStyles.length ? <div className={styles.styleLine}>{postStyles.map((row) => <span key={row.display_tag}>#{row.display_tag}</span>)}</div> : null}
          <Link className={styles.feedHeadline} href={`/outfits/${post.id}`}>{post.headline || "Outfit"}</Link>
          <div className={styles.socialRow}>
            <form action={hasLiked ? unlikeOutfit : likeOutfit}><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="return_to" value={returnTo} /><button className={hasLiked ? styles.likedButton : styles.likeButton} type="submit" aria-pressed={hasLiked}>{hasLiked ? "♥ Liked" : "♡ Like"}</button></form>
            <span>{post.like_count} {post.like_count === 1 ? "like" : "likes"}</span>
            <Link href={`/outfits/${post.id}#comments`}>{post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}</Link>
          </div>
        </div>
      </article>;
    })}</div> : <div className="emptyState"><span className="eyebrow">{feed === "following" ? "NO FOLLOWED OUTFITS YET" : "NO OUTFITS YET"}</span><h2>{feed === "following" ? "The people you follow haven’t posted an Outfit yet." : "Be the first to post a complete look."}</h2>{feed === "following" ? <Link className="secondaryButton" href="/people">Find people →</Link> : <Link className="primaryButton" href="/outfits/new">Create an Outfit →</Link>}</div>}
  </main>;
}
