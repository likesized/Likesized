import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { blockMemberFromOutfit, deleteOutfit, deleteOutfitComment, followFromOutfit, likeOutfit, toggleOutfitComments, unlikeOutfit } from "@/app/outfits/actions";
import { addToWishLocker, likeProduct, removeFromWishLocker, unlikeProduct } from "@/app/likelocker/actions";
import { ReportContentForm } from "@/components/ReportContentForm";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { OUTFIT_OCCASION_LABELS } from "@/lib/outfit-taxonomy";
import { createClient } from "@/lib/supabase/server";
import CommentComposer from "./CommentComposer";
import OutfitEngagementClient from "./OutfitEngagementClient";
import OutfitGallery, { type GalleryGarment, type GalleryPhoto } from "./OutfitGallery";
import styles from "../outfits.module.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Profile = { id?: string; username: string; display_name: string | null; avatar_url?: string | null };
type Outfit = { id: string; user_id: string; headline: string | null; story: string | null; status: "draft" | "published"; comments_enabled: boolean; published_at: string | null; created_at: string; like_count: number; comment_count: number; share_count: number; view_count: number; follows_generated_count: number };
type Photo = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean };
type PhotoTag = { photo_id: string; closet_item_id: string; x: number; y: number };
type FitReport = { closet_item_id: string; size_label: string; fit: string; created_at: string; product_id: string | null };
type Product = { id: string; name: string; slug: string; image_url: string | null; brand_id: string };
type Brand = { id: string; name: string };
type Comment = { id: string; user_id: string | null; body: string; created_at: string; profile: Profile | null };
type PublicComment = { comment_id: string; body: string; created_at: string; username: string; display_name: string | null };
type PublicTeaser = { product_id: string; product_slug: string; brand_name: string; product_name: string; image_url: string | null };
type MatchRecord = { user_id: string; match_score: number };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
function scoreForTarget(data: unknown, targetUserId: string) { return ((data ?? []) as MatchRecord[]).find((row) => row.user_id === targetUserId)?.match_score; }

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Outfit | LikeSized" };
  const supabase = await createClient();
  const [{ data }, { data: creatorRows }] = await Promise.all([
    supabase.from("outfit_posts").select("headline,story,photo_url,status").eq("id", id).eq("status", "published").maybeSingle(),
    supabase.rpc("get_public_outfit_creator", { p_post_id: id }),
  ]);
  if (!data?.headline) return { title: "Outfit | LikeSized" };
  const creator = ((creatorRows ?? [])[0] as Profile | undefined) ?? null;
  const description = (data.story ?? `See @${creator?.username ?? "a LikeSized member"}'s Outfit on LikeSized.`).slice(0, 180);
  const image = data.photo_url ? supabase.storage.from("outfit-photos").getPublicUrl(data.photo_url).data.publicUrl : undefined;
  return {
    title: `${data.headline} | LikeSized`,
    description,
    openGraph: { title: data.headline, description, siteName: "LikeSized", images: image ? [image] : undefined, type: "article" },
    twitter: { card: "summary_large_image", title: data.headline, description, images: image ? [image] : undefined },
  };
}

export default async function OutfitDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const viewerId = claims?.claims?.sub ?? null;

  const { data: outfitData, error: outfitError } = await supabase.from("outfit_posts").select("id,user_id,headline,story,status,comments_enabled,published_at,created_at,like_count,comment_count,share_count,view_count,follows_generated_count").eq("id", id).maybeSingle();
  if (outfitError || !outfitData) notFound();
  const outfit = outfitData as Outfit;
  const owner = viewerId === outfit.user_id;
  if (outfit.status === "draft") {
    if (owner) redirect(`/outfits/new?draft=${outfit.id}`);
    notFound();
  }

  const [creatorResult, photosResult, occasionsResult, stylesResult, teaserResult] = await Promise.all([
    supabase.rpc("get_public_outfit_creator", { p_post_id: id }),
    supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id", id).order("sort_order"),
    supabase.rpc("get_public_outfit_product_teasers", { p_post_id: id }),
  ]);
  if (creatorResult.error) throw new Error(`Could not load Outfit creator: ${creatorResult.error.message}`);
  if (photosResult.error) throw new Error(`Could not load Outfit photos: ${photosResult.error.message}`);
  if (occasionsResult.error) throw new Error(`Could not load Outfit occasions: ${occasionsResult.error.message}`);
  if (stylesResult.error) throw new Error(`Could not load Outfit style tags: ${stylesResult.error.message}`);
  if (teaserResult.error) throw new Error(`Could not load Outfit Product teasers: ${teaserResult.error.message}`);

  const profile = ((creatorResult.data ?? [])[0] as Profile | undefined) ?? null;
  const creatorName = profile?.display_name?.trim() || profile?.username || "LikeSized member";
  const photoRows = (photosResult.data ?? []) as Photo[];
  const publicTeasers = (teaserResult.data ?? []) as PublicTeaser[];
  const photoUrls = new Map<string, string>();
  for (const photo of photoRows) if (photo.bucket === "outfit-photos") photoUrls.set(photo.id, supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl);

  let comments: Comment[] = [];
  if (outfit.comments_enabled) {
    if (viewerId) {
      const { data: commentRows, error } = await supabase.from("outfit_comments").select("id,user_id,body,created_at").eq("post_id", id).order("created_at", { ascending: true }).limit(200);
      if (error) throw new Error(`Could not load Outfit comments: ${error.message}`);
      const authorIds = [...new Set((commentRows ?? []).map((comment) => String(comment.user_id)).filter(Boolean))];
      const profileById = new Map<string, Profile>();
      if (authorIds.length) {
        const { data: authorRows, error: authorError } = await supabase.from("profiles").select("id,username,display_name").in("id", authorIds);
        if (authorError) throw new Error(`Could not load comment authors: ${authorError.message}`);
        for (const author of (authorRows ?? []) as Profile[]) if (author.id) profileById.set(author.id, author);
      }
      comments = (commentRows ?? []).map((comment) => ({
        id: String(comment.id),
        user_id: comment.user_id ? String(comment.user_id) : null,
        body: String(comment.body),
        created_at: String(comment.created_at),
        profile: comment.user_id ? profileById.get(String(comment.user_id)) ?? null : null,
      }));
    } else {
      const { data, error } = await supabase.rpc("get_public_outfit_comments", { p_post_id: id, p_result_limit: 200 });
      if (error) throw new Error(`Could not load Outfit comments: ${error.message}`);
      comments = ((data ?? []) as PublicComment[]).map((comment) => ({
        id: comment.comment_id,
        user_id: null,
        body: comment.body,
        created_at: comment.created_at,
        profile: { username: comment.username, display_name: comment.display_name },
      }));
    }
  }

  let garmentLinks: { post_id: string; closet_item_id: string }[] = [];
  let reports: FitReport[] = [];
  let photoTags: PhotoTag[] = [];
  let liked = false;
  let following = false;
  let creatorOverallMatch: number | undefined;
  let creatorTwinLabel: string | null = null;
  const productById = new Map<string, Product>();
  const brandById = new Map<string, Brand>();
  const retailerByProduct = new Map<string, string>();
  const productLiked = new Set<string>();
  const productWished = new Set<string>();

  if (viewerId) {
    const [linksResult, likesResult, followResult] = await Promise.all([
      supabase.from("outfit_post_items").select("post_id,closet_item_id").eq("post_id", id),
      supabase.from("outfit_likes").select("post_id").eq("post_id", id).eq("user_id", viewerId).maybeSingle(),
      viewerId !== outfit.user_id ? supabase.from("follows").select("followed_id").eq("follower_id", viewerId).eq("followed_id", outfit.user_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (linksResult.error) throw new Error(`Could not load tagged garments: ${linksResult.error.message}`);
    if (likesResult.error) throw new Error(`Could not load Outfit like state: ${likesResult.error.message}`);
    if (followResult.error) throw new Error(`Could not load Outfit follow state: ${followResult.error.message}`);
    garmentLinks = linksResult.data ?? [];
    liked = Boolean(likesResult.data);
    following = Boolean(followResult.data);

    if (!owner) {
      const [settingsResult, overallResult, topsResult, bottomsResult] = await Promise.all([
        supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton", true).maybeSingle(),
        supabase.rpc("get_fit_matches", { p_match_category: "overall", p_result_limit: 100, p_fit_community: "both" }),
        supabase.rpc("get_fit_matches", { p_match_category: "tops", p_result_limit: 100, p_fit_community: "both" }),
        supabase.rpc("get_fit_matches", { p_match_category: "bottoms", p_result_limit: 100, p_fit_community: "both" }),
      ]);
      if (settingsResult.error || overallResult.error || topsResult.error || bottomsResult.error) throw new Error("Could not load Outfit creator Fit Match.");
      const threshold = settingsResult.data?.threshold_percent ?? 85;
      creatorOverallMatch = scoreForTarget(overallResult.data, outfit.user_id);
      if (following) {
        creatorTwinLabel = fitTwinLabel(fitTwinDesignation({
          overall: creatorOverallMatch,
          tops: scoreForTarget(topsResult.data, outfit.user_id),
          bottoms: scoreForTarget(bottomsResult.data, outfit.user_id),
        }, threshold));
      }
    }

    const closetIds = garmentLinks.map((row) => row.closet_item_id);
    if (closetIds.length) {
      const { data, error } = await supabase.from("fit_reports").select("closet_item_id,size_label,fit,created_at,product_id").in("closet_item_id", closetIds).order("created_at", { ascending: false });
      if (error) throw new Error(`Could not load Outfit garment details: ${error.message}`);
      reports = (data ?? []) as FitReport[];
    }
    if (photoRows.length) {
      const { data, error } = await supabase.from("outfit_photo_tags").select("photo_id,closet_item_id,x,y").in("photo_id", photoRows.map((row) => row.id));
      if (error) throw new Error(`Could not load Outfit hotspots: ${error.message}`);
      photoTags = (data ?? []) as PhotoTag[];
    }
  }

  const latestByCloset = new Map<string, FitReport>();
  for (const report of reports) if (!latestByCloset.has(report.closet_item_id)) latestByCloset.set(report.closet_item_id, report);
  const productIds = [...new Set([...latestByCloset.values()].map((report) => report.product_id).filter((value): value is string => Boolean(value)))];

  if (viewerId && productIds.length) {
    const { data: productRows, error: productError } = await supabase.from("products").select("id,name,slug,image_url,brand_id").in("id", productIds);
    if (productError) throw new Error(`Could not load Outfit Products: ${productError.message}`);
    for (const product of (productRows ?? []) as Product[]) productById.set(product.id, product);
    const brandIds = [...new Set([...productById.values()].map((product) => product.brand_id).filter(Boolean))];
    if (brandIds.length) {
      const { data: brandRows, error: brandError } = await supabase.from("brands").select("id,name").in("id", brandIds);
      if (brandError) throw new Error(`Could not load Outfit Brands: ${brandError.message}`);
      for (const brand of (brandRows ?? []) as Brand[]) brandById.set(brand.id, brand);
    }

    const [listingResult, likeResult, wishResult] = await Promise.all([
      supabase.from("retailer_listings").select("product_id,product_url").in("product_id", productIds),
      supabase.from("product_likes").select("product_id").eq("user_id", viewerId).in("product_id", productIds),
      supabase.from("wish_locker_items").select("product_id").eq("user_id", viewerId).in("product_id", productIds),
    ]);
    if (listingResult.error) throw new Error(`Could not load Outfit shopping links: ${listingResult.error.message}`);
    if (likeResult.error) throw new Error(`Could not load Product like state: ${likeResult.error.message}`);
    if (wishResult.error) throw new Error(`Could not load Wishlist state: ${wishResult.error.message}`);
    for (const row of listingResult.data ?? []) if (!retailerByProduct.has(row.product_id) && row.product_url) retailerByProduct.set(row.product_id, row.product_url);
    for (const row of likeResult.data ?? []) productLiked.add(row.product_id);
    for (const row of wishResult.data ?? []) productWished.add(row.product_id);
  }

  const garments: GalleryGarment[] = garmentLinks.flatMap((link) => {
    const report = latestByCloset.get(link.closet_item_id);
    const product = report?.product_id ? productById.get(report.product_id) : null;
    const brand = product ? brandById.get(product.brand_id) : null;
    return report && product ? [{ id: link.closet_item_id, label: `${brand?.name || "Brand"} · ${product.name}`, detail: `Size ${report.size_label} · ${FIT_LABELS[report.fit] || report.fit}`, href: `/item/${product.slug}` }] : [];
  });
  const galleryPhotos: GalleryPhoto[] = photoRows.flatMap((photo) => {
    const url = photoUrls.get(photo.id);
    return url ? [{ id: photo.id, url, tags: photoTags.filter((tag) => tag.photo_id === photo.id).map((tag) => ({ closetItemId: tag.closet_item_id, x: Number(tag.x), y: Number(tag.y) })) }] : [];
  });
  const returnTo = `/outfits/${id}`;
  const publishedAt = outfit.published_at || outfit.created_at;
  const published = first(query.published) === "1";
  const updated = first(query.updated) === "1";
  const reported = first(query.reported) === "1";
  const commentError = first(query.comment_error) === "1";

  return <main className="pageShell">
    {published ? <div className="authMessage">Outfit published.</div> : updated ? <div className="authMessage">Outfit updated.</div> : reported ? <div className="authMessage">Report sent.</div> : null}
    <div className={styles.detailHeader}><div><span className="eyebrow">OUTFIT</span><h1>{outfit.headline || "Outfit"}</h1><div className={styles.creatorLine}><span className="avatar small">{creatorName.slice(0, 1).toUpperCase()}</span><div><strong>{creatorName}</strong>{profile?.username ? <span>@{profile.username}</span> : null}{typeof creatorOverallMatch === "number" ? <span>{creatorOverallMatch}% Fit Match{creatorTwinLabel ? ` · ${creatorTwinLabel}` : ""}</span> : null}<span>{formatDate(publishedAt)}</span></div></div></div><div className={styles.detailHeaderActions}><OutfitEngagementClient postId={id} headline={outfit.headline || "Outfit"} />{owner ? <Link className={styles.compactSecondary} href={`/outfits/new?edit=${id}`}>Edit Outfit</Link> : null}</div></div>

    <div className={styles.detailLayout}><OutfitGallery photos={galleryPhotos} garments={garments} canViewTags={Boolean(viewerId)} /><aside className={styles.storyCard}><div className={styles.pills}>{(occasionsResult.data ?? []).map((row) => <span key={row.occasion}>{OUTFIT_OCCASION_LABELS.get(row.occasion) ?? row.occasion}</span>)}</div>{(stylesResult.data ?? []).length ? <div className={styles.styleLine}>{(stylesResult.data ?? []).map((row) => <span key={row.display_tag}>#{row.display_tag}</span>)}</div> : null}{outfit.story ? <p className={styles.storyText}>{outfit.story}</p> : null}<div className={styles.engagementCounts}><span>♥ {outfit.like_count}</span><span>💬 {outfit.comment_count}</span><span>↗ {outfit.share_count}</span></div>
      {!viewerId ? <div className={styles.memberGate}><strong>See how every piece fit.</strong><p>Join or sign in for sizes worn, Fit Results, Fit Report evidence, photo hotspots, LikeLocker actions, and shopping links.</p><Link className={styles.compactPrimary} href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in to see fit details</Link></div> : null}
      {viewerId && !owner ? <div className={styles.socialActions}><form action={liked ? unlikeOutfit : likeOutfit}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="return_to" value={returnTo} /><button type="submit" className={liked ? styles.likedButton : styles.likeButton}>{liked ? "♥ Liked" : "♡ Like"}</button></form>{!following ? <form action={followFromOutfit}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="return_to" value={returnTo} /><button type="submit">Follow {creatorName}</button></form> : <span className={styles.followingBadge}>Following</span>}</div> : null}
      {owner ? <div className={styles.ownerTools}><h3>Creator analytics</h3><div className={styles.analyticsGrid}><div><strong>{outfit.view_count}</strong><span>Views</span></div><div><strong>{outfit.like_count}</strong><span>Likes</span></div><div><strong>{outfit.comment_count}</strong><span>Comments</span></div><div><strong>{outfit.share_count}</strong><span>Shares</span></div><div><strong>{outfit.follows_generated_count}</strong><span>Follows generated</span></div></div><p className="fieldHelp">Shop clicks are tracked internally by LikeSized and are not creator-facing in V1.</p><form action={toggleOutfitComments}><input type="hidden" name="post_id" value={id} /><input type="hidden" name="return_to" value={returnTo} /><input type="hidden" name="enabled" value={String(!outfit.comments_enabled)} /><button type="submit">{outfit.comments_enabled ? "Turn comments off" : "Turn comments on"}</button></form></div> : null}</aside></div>

    <section className={styles.lookSection}><div className={styles.sectionHeading}><div><span className="eyebrow">EXPLORE THIS LOOK</span><h2>Tagged items</h2></div></div>{!viewerId ? <div className={styles.lookGrid}>{publicTeasers.length ? publicTeasers.map((product) => <article className={styles.lookCard} key={product.product_id}>{product.image_url ? <img className={styles.lookImage} src={product.image_url} alt="" /> : <div className={styles.lookImageFallback}>{product.brand_name.slice(0, 1)}</div>}<div><strong>{product.brand_name} · {product.product_name}</strong><span>Sign in to see size worn and reported fit.</span></div></article>) : <p className="muted">Tagged fit details are available to members.</p>}</div> : <div className={styles.lookGrid}>{garments.map((garment) => {
      const report = latestByCloset.get(garment.id)!;
      const product = report.product_id ? productById.get(report.product_id) : null;
      if (!product) return null;
      const shop = retailerByProduct.get(product.id);
      const hasProductLike = productLiked.has(product.id);
      const hasWish = productWished.has(product.id);
      return <article className={styles.lookCard} key={garment.id}>{product.image_url ? <img className={styles.lookImage} src={product.image_url} alt="" /> : <div className={styles.lookImageFallback}>{garment.label.slice(0, 1)}</div>}<div className={styles.lookInfo}><strong>{garment.label}</strong><span>{garment.detail}</span></div><div className={styles.lookActions}><Link href={garment.href}>View Product</Link><form action={hasProductLike ? unlikeProduct : likeProduct}><input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="return_to" value={returnTo} /><button type="submit">{hasProductLike ? "♥ Liked" : "♡ Like"}</button></form><form action={hasWish ? removeFromWishLocker : addToWishLocker}><input type="hidden" name="product_id" value={product.id} /><input type="hidden" name="return_to" value={returnTo} /><button type="submit">{hasWish ? "✓ Wishlist" : "+ Wishlist"}</button></form>{shop ? <Link className={styles.compactPrimary} href={`/api/outfits/${id}/shop?product_id=${product.id}`}>Shop</Link> : null}</div></article>;
    })}</div>}</section>

    <section className={styles.commentsSection} id="comments"><div className={styles.sectionHeading}><div><span className="eyebrow">COMMENTS</span><h2>{outfit.comments_enabled ? `${outfit.comment_count} ${outfit.comment_count === 1 ? "comment" : "comments"}` : "Comments are off"}</h2></div></div>{outfit.comments_enabled ? <>{viewerId ? <CommentComposer postId={id} returnTo={returnTo} /> : <Link className={styles.compactSecondary} href={`/login?next=${encodeURIComponent(`${returnTo}#comments`)}`}>Sign in to comment</Link>}{commentError ? <div className="authMessage error">Comment must be plain text, 500 characters or less, with no external links.</div> : null}<div className={styles.commentList}>{comments.map((comment) => {
      const authorName = comment.profile?.display_name?.trim() || comment.profile?.username || "LikeSized member";
      const canDelete = Boolean(viewerId && (owner || comment.user_id === viewerId));
      return <article className={styles.comment} key={comment.id}><div><strong>{authorName}</strong><span>{formatDate(comment.created_at)}</span></div><p>{comment.body}</p>{viewerId ? <div className={styles.commentActions}>{canDelete ? <form action={deleteOutfitComment}><input type="hidden" name="comment_id" value={comment.id} /><input type="hidden" name="post_id" value={id} /><input type="hidden" name="return_to" value={returnTo} /><button type="submit">Delete</button></form> : null}{comment.user_id !== viewerId ? <ReportContentForm targetType="outfit_comment" targetId={comment.id} returnTo={returnTo} /> : null}</div> : null}</article>;
    })}</div></> : <p className="muted">The creator turned comments off. Existing comments are preserved and return if comments are turned back on.</p>}</section>

    {viewerId && !owner ? <section className={styles.safetyRow}><ReportContentForm targetType="outfit_post" targetId={id} returnTo={returnTo} /><form action={blockMemberFromOutfit}><input type="hidden" name="member_id" value={outfit.user_id} /><button type="submit">Block member</button></form></section> : null}
    {owner ? <section className={styles.dangerZone}><form action={deleteOutfit}><input type="hidden" name="post_id" value={id} /><button type="submit">Delete Outfit</button></form></section> : null}
  </main>;
}
