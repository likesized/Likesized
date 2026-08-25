import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteOutfitComment, followFromOutfit, likeOutfit, likeOutfitComment, toggleOutfitComments, unlikeOutfit, unlikeOutfitComment } from "@/app/outfits/actions";
import { ReportContentForm } from "@/components/ReportContentForm";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { GARMENT_TYPES } from "@/lib/garment-taxonomy";
import { OUTFIT_OCCASION_LABELS } from "@/lib/outfit-taxonomy";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import CommentComposer from "./CommentComposer";
import CommentThread from "./CommentThread";
import ConfirmDeleteOutfit from "./ConfirmDeleteOutfit";
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
type Photo = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean };
type PhotoTag = { photo_id: string; closet_item_id: string; x: number; y: number };
type FitReport = { closet_item_id: string; size_label: string; fit: string; created_at: string; product_id: string | null };
type Product = { id: string; name: string; slug: string; image_url: string | null; brand_id: string; garment_type_key: string | null };
type Brand = { id: string; name: string };
type Comment = { id: string; user_id: string | null; body: string; created_at: string; like_count: number; profile: Profile | null; avatarUrl: string | null };
type PublicComment = { comment_id: string; body: string; created_at: string; username: string; display_name: string | null; avatar_url: string | null; like_count: number };
type PublicTeaser = { product_id: string; product_slug: string; brand_name: string; product_name: string; image_url: string | null };
type MatchRecord={user_id:string;match_score:number};
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

  const commentsRequest = !outfit.comments_enabled
    ? Promise.resolve({ data: [], error: null })
    : viewerId
      ? supabase.from("outfit_comments").select("id,user_id,body,created_at,like_count").eq("post_id",id).order("created_at",{ascending:true}).limit(200)
      : supabase.rpc("get_public_outfit_comments", { p_post_id: id, p_result_limit: 200 });

  const [creatorResult, photosResult, occasionsResult, stylesResult, teaserResult,commentsResult] = await Promise.all([
    supabase.rpc("get_public_outfit_creator", { p_post_id: id }),
    supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id", id).order("sort_order"),
    supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id", id).order("sort_order"),
    supabase.rpc("get_public_outfit_product_teasers", { p_post_id: id }),
    commentsRequest,
  ]);
  if (creatorResult.error) throw new Error(`Could not load Outfit creator: ${creatorResult.error.message}`);
  if (photosResult.error) throw new Error(`Could not load Outfit photos: ${photosResult.error.message}`);
  if (occasionsResult.error) throw new Error(`Could not load Outfit occasions: ${occasionsResult.error.message}`);
  if (stylesResult.error) throw new Error(`Could not load Outfit style tags: ${stylesResult.error.message}`);
  if (teaserResult.error) throw new Error(`Could not load Outfit Product teasers: ${teaserResult.error.message}`);
  if (commentsResult.error) throw new Error(`Could not load Outfit comments: ${commentsResult.error.message}`);

  const profile = ((creatorResult.data ?? [])[0] as Profile | undefined) ?? null;
  const creatorName = profile?.display_name?.trim() || profile?.username || "LikeSized member";
  const creatorAvatar=currentProfilePhotoUrl(supabase,profile?.avatar_url);
  const photoRows = (photosResult.data ?? []) as Photo[];
  const publicTeasers = (teaserResult.data ?? []) as PublicTeaser[];
  const photoUrls = new Map<string, string>();
  for (const photo of photoRows) if (photo.bucket === "outfit-photos") photoUrls.set(photo.id, supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl);

  let comments:Comment[]=[];
  if(viewerId){
    const rawComments=(commentsResult.data??[]) as {id:string;user_id:string;body:string;created_at:string;like_count:number}[];
    const authorIds=[...new Set(rawComments.map((row)=>row.user_id))];
    const profileById=new Map<string,Profile>();
    if(authorIds.length){
      const {data,error}=await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id",authorIds);
      if(error)throw new Error("Could not load comment authors.");
      for(const author of (data??[]) as (Profile&{id:string})[])profileById.set(author.id,author);
    }
    comments=rawComments.map((row)=>{const author=profileById.get(row.user_id)??null;return {...row,profile:author,avatarUrl:currentProfilePhotoUrl(supabase,author?.avatar_url)};});
  }else{
    comments=((commentsResult.data??[]) as PublicComment[]).map((row)=>({
      id:row.comment_id,
      user_id:null,
      body:row.body,
      created_at:row.created_at,
      like_count:Number(row.like_count)||0,
      profile:{username:row.username,display_name:row.display_name,avatar_url:row.avatar_url},
      avatarUrl:currentProfilePhotoUrl(supabase,row.avatar_url),
    }));
  }

  let garmentLinks: { post_id: string; closet_item_id: string }[] = [];
  let reports: FitReport[] = [];
  let photoTags: PhotoTag[] = [];
  let liked = false;
  let following = false;
  let overallMatch:number|undefined;
  let topsMatch:number|undefined;
  let bottomsMatch:number|undefined;
  let threshold=85;
  const productById = new Map<string, Product>();
  const brandById = new Map<string, Brand>();
  const retailerByProduct = new Map<string, string>();
  const productLiked = new Set<string>();
  const productWished = new Set<string>();
  const commentLiked = new Set<string>();

  if (viewerId) {
    const [linksResult, likesResult, followResult,settingsResult] = await Promise.all([
      supabase.from("outfit_post_items").select("post_id,closet_item_id").eq("post_id", id),
      supabase.from("outfit_likes").select("post_id").eq("post_id", id).eq("user_id", viewerId).maybeSingle(),
      viewerId !== outfit.user_id ? supabase.from("follows").select("followed_id").eq("follower_id", viewerId).eq("followed_id", outfit.user_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      viewerId!==outfit.user_id?supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton",true).maybeSingle():Promise.resolve({data:null,error:null}),
    ]);
    if (linksResult.error||likesResult.error||followResult.error||settingsResult.error) throw new Error("Could not load Outfit member state.");
    garmentLinks = linksResult.data ?? [];
    liked = Boolean(likesResult.data);
    following = Boolean(followResult.data);
    threshold=settingsResult.data?.threshold_percent??85;

    if(!owner){[overallMatch,topsMatch,bottomsMatch]=await Promise.all([scoreFor(supabase,outfit.user_id,"overall"),scoreFor(supabase,outfit.user_id,"tops"),scoreFor(supabase,outfit.user_id,"bottoms")]);}

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
    if(comments.length){
      const {data,error}=await supabase.from("outfit_comment_likes").select("comment_id").eq("user_id",viewerId).in("comment_id",comments.map((comment)=>comment.id));
      if(error)throw new Error("Could not load comment Like state.");
      for(const row of data??[])commentLiked.add(row.comment_id);
    }
  }

  const latestByCloset = new Map<string, FitReport>();
  for (const report of reports) if (!latestByCloset.has(report.closet_item_id)) latestByCloset.set(report.closet_item_id, report);
  const productIds = [...new Set([...latestByCloset.values()].map((report) => report.product_id).filter((value): value is string => Boolean(value)))];

  if (viewerId && productIds.length) {
    const { data: productRows, error: productError } = await supabase.from("products").select("id,name,slug,image_url,brand_id,garment_type_key").in("id", productIds);
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
    if (listingResult.error||likeResult.error||wishResult.error) throw new Error("Could not load Outfit Product actions.");
    for (const row of listingResult.data ?? []) if (!retailerByProduct.has(row.product_id) && row.product_url) retailerByProduct.set(row.product_id, row.product_url);
    for (const row of likeResult.data ?? []) productLiked.add(row.product_id);
    for (const row of wishResult.data ?? []) productWished.add(row.product_id);
  }

  const garments: GalleryGarment[] = garmentLinks.flatMap((link) => {
    const report = latestByCloset.get(link.closet_item_id);
    const product = report?.product_id ? productById.get(report.product_id) : null;
    const brand = product ? brandById.get(product.brand_id) : null;
    if(!report||!product)return [];
    const typeLabel=product.garment_type_key?(TYPE_LABELS.get(product.garment_type_key)??product.garment_type_key.replaceAll("_"," ")):"Garment";
    return [{ id: link.closet_item_id, label: `${brand?.name || "Brand"} · ${product.name}`, detail: typeLabel, href: `/item/${product.slug}`,imageUrl:product.image_url }];
  });
  const galleryPhotos: GalleryPhoto[] = photoRows.flatMap((photo) => {
    const url = photoUrls.get(photo.id);
    return url ? [{ id: photo.id, url, tags: photoTags.filter((tag) => tag.photo_id === photo.id).map((tag) => ({ closetItemId: tag.closet_item_id, x: Number(tag.x), y: Number(tag.y) })) }] : [];
  });
  const memberTaggedItems:TaggedItem[]=garments.flatMap((garment)=>{
    const report=latestByCloset.get(garment.id);const product=report?.product_id?productById.get(report.product_id):null;
    return product?[{closetItemId:garment.id,productId:product.id,label:garment.label,detail:garment.detail,href:garment.href,imageUrl:product.image_url,liked:productLiked.has(product.id),wished:productWished.has(product.id),canShop:retailerByProduct.has(product.id)}]:[];
  });
  const taggedItems:TaggedItem[]=viewerId?memberTaggedItems:publicTeasers.map((product)=>({closetItemId:`product-${product.product_id}`,productId:product.product_id,label:`${product.brand_name} · ${product.product_name}`,detail:"Garment",href:`/item/${product.product_slug}`,imageUrl:product.image_url,liked:false,wished:false,canShop:false}));

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

  const commentNodes=comments.map((comment)=>{
    const authorName=comment.profile?.display_name?.trim()||comment.profile?.username||"LikeSized member";
    const canDelete=Boolean(viewerId&&(owner||comment.user_id===viewerId));
    const isLiked=commentLiked.has(comment.id);
    return <article className={styles.comment} key={comment.id}>
      {comment.avatarUrl?<img className={styles.commentAvatar} src={comment.avatarUrl} alt=""/>:<div className={styles.commentAvatarFallback}>{authorName.slice(0,1).toUpperCase()}</div>}
      <div className={styles.commentBody}>
        <div className={styles.commentIdentity}>{comment.profile?.username?<Link href={`/people/${comment.profile.username}`}><strong>{authorName}</strong><span>@{comment.profile.username}</span></Link>:<strong>{authorName}</strong>}<small>{formatDate(comment.created_at)}</small></div>
        <div className={styles.commentTextRow}><p>{comment.body}</p><div className={styles.commentActions}>
          {viewerId?<form action={isLiked?unlikeOutfitComment:likeOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={commentsReturnTo}/><button type="submit" aria-label={isLiked?"Unlike comment":"Like comment"} title={isLiked?"Unlike comment":"Like comment"}>{isLiked?"♥":"♡"}{comment.like_count?` ${comment.like_count}`:""}</button></form>:<span>♡{comment.like_count?` ${comment.like_count}`:""}</span>}
          {viewerId?<ReportContentForm targetType="outfit_comment" targetId={comment.id} returnTo={commentsReturnTo} summaryLabel="Report comment" iconOnly/>:<span title="Sign in to report">⚑</span>}
          {canDelete?<form action={deleteOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={commentsReturnTo}/><button type="submit">Delete</button></form>:null}
        </div></div>
      </div>
    </article>;
  });
  const commentErrorNode=commentError?<div className="authMessage error">Comment must be plain text, 500 characters or less, with no external links.</div>:null;
  const commentsPanel=outfit.comments_enabled?<CommentThread
    comments={commentNodes}
    commentCount={outfit.comment_count}
    initialOpen={commentsOpen}
    composer={viewerId?<CommentComposer postId={id} returnTo={commentsReturnTo}/>:null}
    signIn={!viewerId?<Link className={styles.compactSecondary} href={`/login?next=${encodeURIComponent(commentsReturnTo)}`}>Sign in to comment</Link>:null}
    error={commentErrorNode}
  />:<p className="muted">Comments are off for this Outfit.</p>;

  return <main className="pageShell">
    {published?<div className="authMessage">Outfit published.</div>:updated?<div className="authMessage">Outfit updated.</div>:reported?<div className="authMessage">Report sent.</div>:null}
    <article className={styles.openOutfit}>
      <header className={styles.outfitIdentityHeader}>
        {creatorAvatar?<img className={styles.outfitIdentityPhoto} src={creatorAvatar} alt=""/>:<div className={styles.outfitIdentityFallback}>{creatorName.slice(0,1).toUpperCase()}</div>}
        <div className={styles.outfitIdentityCopy}>
          <div className={styles.outfitNameLine}>{profile?.username?<Link href={`/people/${profile.username}`}><strong>{creatorName}</strong> <span>@{profile.username}</span></Link>:<strong>{creatorName}</strong>}</div>
          {!owner&&typeof overallMatch==="number"?<div className={styles.outfitMatchLine}><strong>{overallMatch}% Fit Match</strong>{creatorTwin?<span> · {creatorTwin}</span>:null}</div>:null}
          <small>{formatDate(publishedAt)}</small>
        </div>
      </header>

      <OutfitGallery photos={galleryPhotos} garments={garments} canViewTags={Boolean(viewerId)}/>

      <div className={styles.outfitActionBar}>
        {!owner?<>
          {viewerId?<form action={liked?unlikeOutfit:likeOutfit}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><button className={styles.iconAction} type="submit" aria-label={liked?"Unlike Outfit":"Like Outfit"} title={liked?"Unlike Outfit":"Like Outfit"}><span aria-hidden="true">{liked?"♥":"♡"}</span><span className={styles.actionCount}>{outfit.like_count}</span></button></form>:<Link className={styles.iconAction} href={`/login?next=${encodeURIComponent(returnTo)}`} aria-label="Sign in to Like Outfit" title="Sign in to Like Outfit"><span aria-hidden="true">♡</span><span className={styles.actionCount}>{outfit.like_count}</span></Link>}
          {viewerId?following?<button className={styles.iconAction} type="button" aria-label="Following" title="Following" disabled>👤✓</button>:<form action={followFromOutfit}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><button className={styles.iconAction} type="submit" aria-label={`Follow @${profile?.username??creatorName}`} title="Follow">👤+</button></form>:<Link className={styles.iconAction} href={`/login?next=${encodeURIComponent(returnTo)}`} aria-label="Sign in to Follow" title="Sign in to Follow">👤+</Link>}
        </>:null}
        <OutfitEngagementClient postId={id} headline={outfit.headline||"Outfit"} shareCount={outfit.share_count}/>
        {!owner?(viewerId?<ReportContentForm targetType="outfit_post" targetId={id} returnTo={returnTo} summaryLabel="Report Outfit" iconOnly/>:<Link className={styles.iconAction} href={`/login?next=${encodeURIComponent(returnTo)}`} aria-label="Sign in to Report Outfit" title="Sign in to Report Outfit">⚑</Link>):null}
      </div>

      <OutfitTabs initialTab={initialTab} commentCount={outfit.comment_count} styleNotes={styleNotes} comments={commentsPanel} taggedItems={<TaggedItemsPanel items={taggedItems} postId={id} signedIn={Boolean(viewerId)}/>}/>

      {owner?<section className={styles.ownerTools}>
        <div><strong>{outfit.view_count}</strong><span>Views</span></div><div><strong>{outfit.follows_generated_count}</strong><span>Follows generated</span></div>
        <Link className={styles.compactSecondary} href={`/outfits/new?edit=${id}`}>Edit Outfit</Link>
        <form action={toggleOutfitComments}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="enabled" value={String(!outfit.comments_enabled)}/><button type="submit">{outfit.comments_enabled?"Turn comments off":"Turn comments on"}</button></form>
        <ConfirmDeleteOutfit postId={id}/>
      </section>:null}
    </article>
  </main>;
}
