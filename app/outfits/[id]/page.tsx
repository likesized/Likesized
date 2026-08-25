import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { likeOutfit, toggleOutfitComments, unlikeOutfit } from "@/app/outfits/actions";
import { ReportContentForm } from "@/components/ReportContentForm";
import { UniversalActionBar, UniversalActionButton, UniversalActionLink } from "@/components/UniversalActionBar";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { OUTFIT_OCCASION_LABELS } from "@/lib/outfit-taxonomy";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import CommentThread from "./CommentThread";
import ConfirmDeleteOutfit from "./ConfirmDeleteOutfit";
import CreatorQuickView from "./CreatorQuickView";
import OutfitEngagementClient from "./OutfitEngagementClient";
import OutfitGallery, { type GalleryGarment, type GalleryPhoto } from "./OutfitGallery";
import OutfitTabs, { type OutfitTabKey } from "./OutfitTabs";
import TaggedItemsPanel, { type TaggedItem } from "./TaggedItemsPanel";
import styles from "./outfitDetail.module.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPE_LABELS = new Map(GARMENT_TYPES.map((item)=>[item.key,item.label]));
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Profile = { id?: string; username: string; display_name: string | null; avatar_url?: string | null };
type Outfit = { id: string; user_id: string; headline: string | null; story: string | null; status: "draft" | "published"; comments_enabled: boolean; published_at: string | null; created_at: string; like_count: number; comment_count: number; share_count: number; view_count: number; follows_generated_count: number };
type Photo = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean; caption:string|null };
type PublicTaggedItem = { closet_item_id:string; product_id:string; product_slug:string; brand_name:string; product_name:string; image_url:string|null; garment_type_key:string|null };
type PublicHotspot = { photo_id:string; closet_item_id:string; x:number|string; y:number|string };
type MatchRecord={user_id:string;match_score:number};
type NotificationSubscription={followed_id:string};
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
function tabKey(value:string|undefined):OutfitTabKey{return value==="comments"||value==="tagged"?value:"style";}

async function scoreFor(supabase:Awaited<ReturnType<typeof createClient>>,targetUserId:string,category:"overall"|"tops"|"bottoms"){
  const {data,error}=await supabase.rpc("get_fit_matches",{p_match_category:category,p_result_limit:100});
  if(error)return undefined;
  return ((data??[]) as MatchRecord[]).find((row)=>row.user_id===targetUserId)?.match_score;
}

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
  return { title: `${data.headline} | LikeSized`, description, openGraph: { title: data.headline, description, siteName: "LikeSized", images: image ? [image] : undefined, type: "article" }, twitter: { card: "summary_large_image", title: data.headline, description, images: image ? [image] : undefined } };
}

export default async function OutfitDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const query = await searchParams;
  const initialTab=tabKey(first(query.tab));
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

  const [creatorResult, photosResult, occasionsResult, stylesResult, publicItemsResult, hotspotsResult] = await Promise.all([
    supabase.rpc("get_public_outfit_creator", { p_post_id: id }),
    supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main,caption").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id", id).order("sort_order"),
    supabase.rpc("get_public_outfit_tagged_items", { p_post_id: id }),
    supabase.rpc("get_public_outfit_hotspots", { p_post_id: id }),
  ]);
  if (creatorResult.error) throw new Error(`Could not load Outfit creator: ${creatorResult.error.message}`);
  if (photosResult.error) throw new Error(`Could not load Outfit photos: ${photosResult.error.message}`);
  if (occasionsResult.error) throw new Error(`Could not load Outfit occasions: ${occasionsResult.error.message}`);
  if (stylesResult.error) throw new Error(`Could not load Outfit style tags: ${stylesResult.error.message}`);
  if (publicItemsResult.error) throw new Error(`Could not load Outfit tagged items: ${publicItemsResult.error.message}`);
  if (hotspotsResult.error) throw new Error(`Could not load Outfit hotspots: ${hotspotsResult.error.message}`);

  const profile = ((creatorResult.data ?? [])[0] as Profile | undefined) ?? null;
  const creatorName = profile?.display_name?.trim() || profile?.username || "LikeSized member";
  const creatorAvatar=currentProfilePhotoUrl(supabase,profile?.avatar_url);
  const photoRows = (photosResult.data ?? []) as Photo[];
  const publicItems=(publicItemsResult.data??[]) as PublicTaggedItem[];
  const photoTags=(hotspotsResult.data??[]) as PublicHotspot[];
  const photoUrls = new Map<string, string>();
  for (const photo of photoRows) if (photo.bucket === "outfit-photos") photoUrls.set(photo.id, supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl);

  const [fitReportCountResult,outfitCountResult]=await Promise.all([
    viewerId?supabase.from("fit_reports").select("id",{count:"exact",head:true}).eq("user_id",outfit.user_id):Promise.resolve({count:null,error:null}),
    supabase.from("outfit_posts").select("id",{count:"exact",head:true}).eq("user_id",outfit.user_id).eq("status","published"),
  ]);
  const creatorFitReportCount=fitReportCountResult.error?null:fitReportCountResult.count;
  const creatorOutfitCount=outfitCountResult.error?null:outfitCountResult.count;

  let liked = false;
  let following = false;
  let notificationsOn = false;
  let overallMatch:number|undefined;
  let topsMatch:number|undefined;
  let bottomsMatch:number|undefined;
  let threshold=85;
  const retailerByProduct = new Map<string, string>();
  const productLiked = new Set<string>();
  const productWished = new Set<string>();
  const productIds=[...new Set(publicItems.map((item)=>item.product_id))];

  if (viewerId) {
    const [likesResult, followResult,settingsResult,notificationResult] = await Promise.all([
      supabase.from("outfit_likes").select("post_id").eq("post_id", id).eq("user_id", viewerId).maybeSingle(),
      viewerId !== outfit.user_id ? supabase.from("follows").select("followed_id").eq("follower_id", viewerId).eq("followed_id", outfit.user_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      viewerId!==outfit.user_id?supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton",true).maybeSingle():Promise.resolve({data:null,error:null}),
      viewerId!==outfit.user_id?supabase.rpc("get_following_notification_subscriptions"):Promise.resolve({data:[],error:null}),
    ]);
    if (likesResult.error||followResult.error||settingsResult.error||notificationResult.error) throw new Error("Could not load Outfit member state.");
    liked = Boolean(likesResult.data);
    following = Boolean(followResult.data);
    notificationsOn=((notificationResult.data??[]) as NotificationSubscription[]).some((row)=>row.followed_id===outfit.user_id);
    threshold=settingsResult.data?.threshold_percent??85;

    if(!owner){[overallMatch,topsMatch,bottomsMatch]=await Promise.all([scoreFor(supabase,outfit.user_id,"overall"),scoreFor(supabase,outfit.user_id,"tops"),scoreFor(supabase,outfit.user_id,"bottoms")]);}

    if(productIds.length){
      const [listingResult, likeResult, wishResult] = await Promise.all([
        supabase.from("retailer_listings").select("product_id,product_url").in("product_id", productIds),
        supabase.from("product_likes").select("product_id").eq("user_id", viewerId).in("product_id", productIds),
        supabase.from("wish_locker_items").select("product_id").eq("user_id", viewerId).in("product_id", productIds),
      ]);
      if (listingResult.error||likeResult.error||wishResult.error) throw new Error("Could not load Outfit Product actions.");
      for (const row of listingResult.data ?? []) if (!retailerByProduct.has(row.product_id) && row.product_url) retailerByProduct.set(row.product_id, row.product_url);
      for (const row of likeResult.data ?? []) productLiked.add(row.product_id);
      for (const row of wishResult.data ?? []) productWished.add(row.product_id);
    }
  }

  const garments: GalleryGarment[] = publicItems.map((item) => {
    const typeLabel=item.garment_type_key?(TYPE_LABELS.get(item.garment_type_key)??item.garment_type_key.replaceAll("_"," ")):"Garment";
    return {id:item.closet_item_id,label:`${item.brand_name} · ${item.product_name}`,detail:typeLabel,href:`/item/${item.product_slug}`,imageUrl:item.image_url};
  });
  const galleryPhotos: GalleryPhoto[] = photoRows.flatMap((photo) => {
    const url = photoUrls.get(photo.id);
    return url ? [{ id: photo.id, url, caption:photo.caption, tags: photoTags.filter((tag) => tag.photo_id === photo.id).map((tag) => ({ closetItemId: tag.closet_item_id, x: Number(tag.x), y: Number(tag.y) })) }] : [];
  });
  const taggedItems:TaggedItem[]=publicItems.map((item)=>({
    closetItemId:item.closet_item_id,
    productId:item.product_id,
    label:`${item.brand_name} · ${item.product_name}`,
    detail:item.garment_type_key?(TYPE_LABELS.get(item.garment_type_key)??item.garment_type_key.replaceAll("_"," ")):"Garment",
    href:`/item/${item.product_slug}`,
    imageUrl:item.image_url,
    liked:productLiked.has(item.product_id),
    wished:productWished.has(item.product_id),
    canShop:Boolean(viewerId)&&retailerByProduct.has(item.product_id),
  }));

  const returnTo = `/outfits/${id}`;
  const commentsReturnTo=`/outfits/${id}?tab=comments&comments=1`;
  const publishedAt = outfit.published_at || outfit.created_at;
  const published = first(query.published) === "1";
  const updated = first(query.updated) === "1";
  const reported = first(query.reported) === "1";
  const commentError = first(query.comment_error) === "1";
  const commentsOpen = first(query.comments) === "1";
  const creatorTwin=viewerId&&!owner&&following?fitTwinLabel(fitTwinDesignation({overall:overallMatch,tops:topsMatch,bottoms:bottomsMatch},threshold)):null;

  const styleNotes=<div className={styles.styleNotes}>
    <h1>{outfit.headline||"Outfit"}</h1>
    <div className={styles.pills}>{(occasionsResult.data??[]).map((row)=><span key={row.occasion}>{OUTFIT_OCCASION_LABELS.get(row.occasion)??row.occasion}</span>)}{(stylesResult.data??[]).map((row)=><span key={row.display_tag}>#{row.display_tag}</span>)}</div>
    {outfit.story?<p className={styles.storyText}>{outfit.story}</p>:<p className="muted">No Style Notes added.</p>}
  </div>;

  const commentErrorNode=commentError?<div className="authMessage error">Comment must be plain text, 500 characters or less, with no external links.</div>:null;
  const commentsPanel=outfit.comments_enabled?<CommentThread
    postId={id}
    commentCount={outfit.comment_count}
    initialOpen={commentsOpen}
    signedIn={Boolean(viewerId)}
    signIn={!viewerId?<Link prefetch={false} className={styles.compactSecondary} href={`/login?next=${encodeURIComponent(commentsReturnTo)}`}>Sign in to comment</Link>:null}
    error={commentErrorNode}
  />:<p className="muted">Comments are off for this Outfit.</p>;

  return <main className="pageShell">
    {published?<div className="authMessage">Outfit published.</div>:updated?<div className="authMessage">Outfit updated.</div>:reported?<div className="authMessage">Report sent.</div>:null}
    <article className={styles.openOutfit}>
      <CreatorQuickView
        postId={id}
        creatorUserId={outfit.user_id}
        username={profile?.username??null}
        displayName={creatorName}
        avatarUrl={creatorAvatar}
        publishedDate={formatDate(publishedAt)}
        signedIn={Boolean(viewerId)}
        owner={owner}
        following={following}
        notificationsOn={notificationsOn}
        overallMatch={overallMatch}
        topsMatch={topsMatch}
        bottomsMatch={bottomsMatch}
        twinLabel={creatorTwin}
        fitReportCount={creatorFitReportCount}
        outfitCount={creatorOutfitCount}
      />

      <OutfitGallery photos={galleryPhotos} garments={garments}/>

      <UniversalActionBar className={styles.outfitActionBar} ariaLabel="Outfit actions">
        {!owner?(viewerId?<form action={liked?unlikeOutfit:likeOutfit}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><UniversalActionButton className={styles.iconAction} action="likeLocker" active={liked} type="submit" count={outfit.like_count} countClassName={styles.actionCount}/></form>:<UniversalActionLink className={styles.iconAction} action="likeLocker" href={`/login?next=${encodeURIComponent(returnTo)}`} ariaLabel="Sign in to add Outfit to LikeLocker" count={outfit.like_count} countClassName={styles.actionCount}/>):null}
        <OutfitEngagementClient postId={id} headline={outfit.headline||"Outfit"} shareCount={outfit.share_count}/>
        {!owner?(viewerId?<ReportContentForm targetType="outfit_post" targetId={id} returnTo={returnTo} summaryLabel="Report Outfit" iconOnly/>:<UniversalActionLink className={styles.iconAction} action="report" href={`/login?next=${encodeURIComponent(returnTo)}`} ariaLabel="Sign in to Report Outfit"/>):null}
      </UniversalActionBar>

      <OutfitTabs initialTab={initialTab} commentCount={outfit.comment_count} styleNotes={styleNotes} comments={commentsPanel} taggedItems={<TaggedItemsPanel items={taggedItems} postId={id} signedIn={Boolean(viewerId)}/>}/>

      {owner?<section className={styles.ownerTools}>
        <div><strong>{outfit.view_count}</strong><span>Views</span></div><div><strong>{outfit.follows_generated_count}</strong><span>Follows generated</span></div>
        <Link prefetch={false} className={styles.compactSecondary} href={`/outfits/new?edit=${id}`}>Edit Outfit</Link>
        <form action={toggleOutfitComments}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="enabled" value={String(!outfit.comments_enabled)}/><button type="submit">{outfit.comments_enabled?"Turn comments off":"Turn comments on"}</button></form>
        <ConfirmDeleteOutfit postId={id}/>
      </section>:null}
    </article>
  </main>;
}
