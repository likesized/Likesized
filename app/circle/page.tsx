import Link from "next/link";
import { redirect } from "next/navigation";
import CommentThread from "@/app/outfits/[id]/CommentThread";
import OutfitGallery, { type GalleryPhoto } from "@/app/outfits/[id]/OutfitGallery";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { OUTFIT_OCCASIONS } from "@/lib/outfit-taxonomy";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import { StyleFeedFilters } from "./StyleFeedFilters";
import { StyleFeedLikeButton } from "./StyleFeedLikeButton";
import { StyleFeedShareButton } from "./StyleFeedShareButton";
import styles from "./circle.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type FeedScope = "twins" | "all";
type Match = { user_id: string; match_score: number };
type OutfitPost = {
  id: string;
  user_id: string;
  headline: string | null;
  story: string | null;
  caption: string | null;
  photo_url: string;
  published_at: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  comments_enabled: boolean;
};
type Profile = { id: string; username: string; display_name: string | null; avatar_url: string | null };
type FeedPhoto = { id:string;post_id:string;bucket:string;feed_path:string|null;display_path:string;sort_order:number;caption:string|null };
type OccasionRow = { post_id: string; occasion: string; sort_order: number };
type StyleTagRow = { post_id: string; normalized_tag: string; display_tag: string; sort_order: number };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function feedScope(value: string | undefined): FeedScope {
  return value === "all" ? "all" : "twins";
}
function clean(value: string | undefined, max = 80) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}
function normalizeStyleTag(value: string | undefined) {
  return clean(value, 30).replace(/^#+/, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
}
function matchMap(data: unknown) {
  return new Map(((data ?? []) as Match[]).map((row) => [row.user_id, row.match_score]));
}
function feedHref(scope: FeedScope, occasion = "", styleTag = "") {
  const params = new URLSearchParams();
  if (scope === "all") params.set("scope", "all");
  if (occasion) params.set("occasion", occasion);
  if (styleTag) params.set("style", styleTag);
  const query = params.toString();
  return query ? `/circle?${query}` : "/circle";
}
function date(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value ?? fallback));
}
function shortNote(value: string | null) {
  const text = value?.trim();
  if (!text) return null;
  return text.length > 260 ? `${text.slice(0, 257).trimEnd()}…` : text;
}
function occasionLabel(value: string) {
  return OUTFIT_OCCASIONS.find((item) => item.value === value)?.label ?? value;
}

export default async function StyleFeedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const scope = feedScope(first(params.scope));
  const occasion = clean(first(params.occasion));
  const styleTag = normalizeStyleTag(first(params.style));
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub;
  if (claimsError || !viewerId) redirect("/login?next=/circle");

  const [
    { data: profile, error: profileError },
    { data: fitProfile, error: fitProfileError },
    { data: followData, error: followError },
    topsResult,
    bottomsResult,
    { data: twinSettings, error: twinSettingsError },
  ] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id", viewerId).maybeSingle(),
    supabase.from("follows").select("followed_id").eq("follower_id", viewerId),
    supabase.rpc("get_fit_matches", { p_match_category: "tops", p_result_limit: 100 }),
    supabase.rpc("get_fit_matches", { p_match_category: "bottoms", p_result_limit: 100 }),
    supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton", true).maybeSingle(),
  ]);
  if (profileError || fitProfileError || followError || topsResult.error || bottomsResult.error || twinSettingsError) {
    throw new Error("Could not load Style Feed.");
  }
  if (!profile?.username || !fitProfile?.completed_at) redirect("/onboarding");

  const followedIds = [...new Set((followData ?? []).map((row: { followed_id: string }) => row.followed_id))];
  const tops = matchMap(topsResult.data);
  const bottoms = matchMap(bottomsResult.data);
  const threshold = twinSettings?.threshold_percent ?? 85;
  const designationFor = (userId: string) => fitTwinDesignation({ tops: tops.get(userId), bottoms: bottoms.get(userId) }, threshold);

  let posts: OutfitPost[] = [];
  if (followedIds.length) {
    const result = await supabase
      .from("outfit_posts")
      .select("id,user_id,headline,story,caption,photo_url,published_at,created_at,like_count,comment_count,share_count,comments_enabled")
      .eq("status", "published")
      .in("user_id", followedIds)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(120);
    if (result.error) throw new Error("Could not load followed Outfits.");
    posts = (result.data ?? []) as OutfitPost[];
  }

  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.user_id))];
  const [profileResult, photoResult, occasionResult, styleTagResult, likeResult] = postIds.length
    ? await Promise.all([
        authorIds.length
          ? supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", authorIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("outfit_photos").select("id,post_id,bucket,feed_path,display_path,sort_order,caption").in("post_id", postIds).eq("bucket", "outfit-photos").order("sort_order"),
        supabase.from("outfit_occasions").select("post_id,occasion,sort_order").in("post_id", postIds).order("sort_order"),
        supabase.from("outfit_style_tags").select("post_id,normalized_tag,display_tag,sort_order").in("post_id", postIds).order("sort_order"),
        supabase.from("outfit_likes").select("post_id").eq("user_id", viewerId).in("post_id", postIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (profileResult.error || photoResult.error || occasionResult.error || styleTagResult.error || likeResult.error) {
    throw new Error("Could not finish loading Style Feed.");
  }

  const profiles = new Map(((profileResult.data ?? []) as Profile[]).map((person) => [person.id, person]));
  const photoRowsByPost = new Map<string, FeedPhoto[]>();
  for (const photo of (photoResult.data ?? []) as FeedPhoto[]) {
    const current=photoRowsByPost.get(photo.post_id)??[];
    current.push(photo);
    photoRowsByPost.set(photo.post_id,current);
  }
  const occasionsByPost = new Map<string, OccasionRow[]>();
  for (const row of (occasionResult.data ?? []) as OccasionRow[]) {
    const current = occasionsByPost.get(row.post_id) ?? [];
    current.push(row);
    occasionsByPost.set(row.post_id, current);
  }
  const styleTagsByPost = new Map<string, StyleTagRow[]>();
  const styleTagOptions = new Map<string, string>();
  for (const row of (styleTagResult.data ?? []) as StyleTagRow[]) {
    const current = styleTagsByPost.get(row.post_id) ?? [];
    current.push(row);
    styleTagsByPost.set(row.post_id, current);
    if (!styleTagOptions.has(row.normalized_tag)) styleTagOptions.set(row.normalized_tag, row.display_tag);
  }
  const likedPostIds = new Set((likeResult.data ?? []).map((row: { post_id: string }) => row.post_id));

  const feed = posts.filter((post) => {
    if (scope === "twins" && !designationFor(post.user_id)) return false;
    if (occasion && !(occasionsByPost.get(post.id) ?? []).some((row) => row.occasion === occasion)) return false;
    if (styleTag && !(styleTagsByPost.get(post.id) ?? []).some((row) => row.normalized_tag === styleTag)) return false;
    return true;
  });

  const galleryPhotosByPost = new Map<string, GalleryPhoto[]>();
  await Promise.all(feed.map(async (post) => {
    const rows=photoRowsByPost.get(post.id)??[];
    if(rows.length){
      const resolved=await Promise.all(rows.map(async (row):Promise<GalleryPhoto|null>=>{
        const {data:displayData}=await supabase.storage.from("outfit-photos").createSignedUrl(row.display_path,1800);
        if(!displayData?.signedUrl)return null;
        const previewPath=row.feed_path||outfitFeedPhotoPath(row.display_path);
        let previewUrl=displayData.signedUrl;
        if(previewPath&&previewPath!==row.display_path){
          const {data:previewData}=await supabase.storage.from("outfit-photos").createSignedUrl(previewPath,1800);
          if(previewData?.signedUrl)previewUrl=previewData.signedUrl;
        }
        return {id:row.id,url:displayData.signedUrl,previewUrl,caption:row.caption,tags:[]};
      }));
      const photos=resolved.filter((photo):photo is GalleryPhoto=>Boolean(photo));
      if(photos.length)galleryPhotosByPost.set(post.id,photos);
      return;
    }
    if(!post.photo_url)return;
    const {data:displayData}=await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url,1800);
    if(!displayData?.signedUrl)return;
    const previewPath=outfitFeedPhotoPath(post.photo_url);
    let previewUrl=displayData.signedUrl;
    if(previewPath!==post.photo_url){
      const {data:previewData}=await supabase.storage.from("outfit-photos").createSignedUrl(previewPath,1800);
      if(previewData?.signedUrl)previewUrl=previewData.signedUrl;
    }
    galleryPhotosByPost.set(post.id,[{id:`${post.id}-main`,url:displayData.signedUrl,previewUrl,caption:post.caption,tags:[]}]);
  }));

  const hasFilters = Boolean(occasion || styleTag);
  const selectedStyleDisplay = styleTagOptions.get(styleTag) ?? first(params.style) ?? "";
  const styleOptions=[...styleTagOptions.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([key,label])=>({key,label}));

  return (
    <main className="pageShell">
      <header className={styles.pageHeader}>
        <span className="eyebrow">STYLE FEED</span>
        <h1>Style Feed</h1>
        <p>Outfit inspiration from people you follow.</p>
      </header>

      <nav className={styles.scopeTabs} aria-label="Style Feed people filter">
        <Link className={scope === "twins" ? styles.activeTab : styles.tab} href={feedHref("twins", occasion, styleTag)}>Fit Twins</Link>
        <Link className={scope === "all" ? styles.activeTab : styles.tab} href={feedHref("all", occasion, styleTag)}>All Following</Link>
      </nav>

      <StyleFeedFilters scope={scope} occasion={occasion} styleDisplay={String(selectedStyleDisplay)} styleOptions={styleOptions}/>
      {hasFilters?<div className={styles.filterActions}><Link className="textLink" href={feedHref(scope)}>Clear filters</Link></div>:null}

      {feed.length ? (
        <section className={styles.feed} aria-label="Outfits from people you follow">
          {feed.map((post) => {
            const person = profiles.get(post.user_id);
            if (!person) return null;
            const name = person.display_name?.trim() || person.username;
            const twinLabel = fitTwinLabel(designationFor(post.user_id));
            const photos=galleryPhotosByPost.get(post.id)??[];
            const note = shortNote(post.story ?? post.caption);
            const postOccasions = occasionsByPost.get(post.id) ?? [];
            const postStyleTags = styleTagsByPost.get(post.id) ?? [];
            const liked = likedPostIds.has(post.id);
            const avatar = currentProfilePhotoUrl(supabase, person.avatar_url);
            return (
              <article className={styles.card} key={post.id}>
                <div className={styles.creatorRow}>
                  <Link prefetch={false} className={styles.creator} href={`/people/${person.username}`}>
                    {avatar ? <img className={styles.avatar} src={avatar} alt="" /> : <span className={styles.avatarFallback}>{name.slice(0, 1).toUpperCase()}</span>}
                    <span className={styles.identity}><strong>{name}</strong><span>@{person.username}</span></span>
                  </Link>
                  <div className={styles.creatorMeta}>
                    {twinLabel ? <span className={styles.twinBadge}>{twinLabel}</span> : null}
                    <time>{date(post.published_at, post.created_at)}</time>
                  </div>
                </div>

                <div className={styles.feedGallery}>
                  {photos.length?<OutfitGallery photos={photos} garments={[]}/>:<span className={styles.photoFallback}>OUTFIT</span>}
                </div>

                <div className={styles.body}>
                  <h2 className={styles.headline}>{post.headline?.trim() || "Outfit"}</h2>
                  {note ? <p className={styles.note}>{note}</p> : null}
                  {(postOccasions.length || postStyleTags.length) ? (
                    <div className={styles.tags}>
                      {postOccasions.map((row) => <Link key={`${post.id}-occasion-${row.occasion}`} href={feedHref(scope, row.occasion, styleTag)}>{occasionLabel(row.occasion)}</Link>)}
                      {postStyleTags.map((row) => <Link key={`${post.id}-style-${row.normalized_tag}`} href={feedHref(scope, occasion, row.normalized_tag)}>#{row.display_tag}</Link>)}
                    </div>
                  ) : null}
                  <div className={styles.actions}>
                    <StyleFeedLikeButton className={styles.actionButton} postId={post.id} initialLiked={liked} initialCount={post.like_count}/>
                    {post.comments_enabled?<CommentThread postId={post.id} commentCount={post.comment_count} signedIn signIn={null} triggerOnly triggerClassName={styles.actionButton} triggerLabel={`Comments${post.comment_count?` ${post.comment_count}`:""}`}/>:<span className={styles.disabledAction}>Comments off</span>}
                    <StyleFeedShareButton className={styles.actionButton} postId={post.id} headline={post.headline?.trim() || "LikeSized Outfit"} />
                  </div>
                  <Link prefetch={false} className={styles.fullOutfitLink} href={`/outfits/${post.id}`} data-full-navigation="true">View Full Outfit →</Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <h2>{scope === "twins" ? "No Fit Twin Outfits here yet." : "No Outfits here yet."}</h2>
          <p>{hasFilters ? "No followed Outfits match these filters." : scope === "twins" ? "When your Fit Twins post Outfits, they’ll appear here." : "Follow people to bring their Outfit posts into your Style Feed."}</p>
          {hasFilters ? <Link className="textLink" href={feedHref(scope)}>Clear filters</Link> : null}
        </section>
      )}

      {scope === "twins" ? (
        <footer className={styles.feedFooter}>
          <Link className="textLink" href={feedHref("all", occasion, styleTag)}>See All Following →</Link>
          <Link className="textLink" href="/people">Find More Fit Twins →</Link>
        </footer>
      ) : null}
    </main>
  );
}
