import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { blockMemberFromOutfit, deleteOutfit, deleteOutfitComment, followFromOutfit, likeOutfit, toggleOutfitComments, unlikeOutfit } from "@/app/outfits/actions";
import { ReportContentForm } from "@/components/ReportContentForm";
import { OUTFIT_OCCASION_LABELS } from "@/lib/outfit-taxonomy";
import { createClient } from "@/lib/supabase/server";
import CommentComposer from "./CommentComposer";
import OutfitEngagementClient from "./OutfitEngagementClient";
import OutfitGallery, { type GalleryGarment, type GalleryPhoto } from "./OutfitGallery";
import styles from "../outfits.module.css";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
type Params=Promise<{id:string}>;
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type Profile={username:string;display_name:string|null;avatar_url:string|null};
type Outfit={id:string;user_id:string;headline:string|null;story:string|null;status:"draft"|"published";comments_enabled:boolean;published_at:string|null;created_at:string;like_count:number;comment_count:number;share_count:number;view_count:number;follows_generated_count:number;profile:unknown};
type Photo={id:string;bucket:"outfit-photos"|"outfit-draft-photos";display_path:string;sort_order:number;is_main:boolean};
type PhotoTag={photo_id:string;closet_item_id:string;x:number;y:number};
type FitReport={closet_item_id:string;size_label:string;fit:string;created_at:string;product:unknown};
type Product={id:string;name:string;slug:string;retailer_url:string|null;brand:unknown};
type Brand={name:string};
type Comment={id:string;user_id:string;body:string;created_at:string;profile:unknown};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function formatDate(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}

export async function generateMetadata({params}:{params:Params}):Promise<Metadata>{
  const {id}=await params;if(!UUID.test(id))return {title:"Outfit | LikeSized"};
  const supabase=await createClient();
  const {data}=await supabase.from("outfit_posts").select("headline,story,photo_url,status").eq("id",id).eq("status","published").maybeSingle();
  if(!data?.headline)return {title:"Outfit | LikeSized"};
  const description=(data.story??"See this Outfit on LikeSized.").slice(0,180);
  const image=data.photo_url?supabase.storage.from("outfit-photos").getPublicUrl(data.photo_url).data.publicUrl:undefined;
  return {title:`${data.headline} | LikeSized`,description,openGraph:{title:data.headline,description,images:image?[image]:undefined,type:"article"}};
}

export default async function OutfitDetailPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {id}=await params;if(!UUID.test(id))notFound();
  const query=await searchParams;
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  const viewerId=claims?.claims?.sub??null;
  const {data:outfitData,error:outfitError}=await supabase.from("outfit_posts").select("id,user_id,headline,story,status,comments_enabled,published_at,created_at,like_count,comment_count,share_count,view_count,follows_generated_count,profile:profiles(username,display_name,avatar_url)").eq("id",id).maybeSingle();
  if(outfitError||!outfitData)notFound();
  const outfit=outfitData as Outfit;
  const owner=viewerId===outfit.user_id;
  if(outfit.status==="draft"){
    if(owner)redirect(`/outfits/new?draft=${outfit.id}`);
    notFound();
  }
  const profile=one<Profile>(outfit.profile);
  const creatorName=profile?.display_name?.trim()||profile?.username||"LikeSized member";

  const [photosResult,occasionsResult,stylesResult]=await Promise.all([
    supabase.from("outfit_photos").select("id,bucket,display_path,sort_order,is_main").eq("post_id",id).order("sort_order"),
    supabase.from("outfit_occasions").select("occasion,sort_order").eq("post_id",id).order("sort_order"),
    supabase.from("outfit_style_tags").select("display_tag,sort_order").eq("post_id",id).order("sort_order"),
  ]);
  if(photosResult.error||occasionsResult.error||stylesResult.error)throw new Error("Could not load this Outfit.");
  const photoRows=(photosResult.data??[]) as Photo[];
  const photoUrls=new Map<string,string>();
  for(const photo of photoRows){
    if(photo.bucket==="outfit-photos")photoUrls.set(photo.id,supabase.storage.from("outfit-photos").getPublicUrl(photo.display_path).data.publicUrl);
  }

  let garmentLinks:{post_id:string;closet_item_id:string}[]=[];
  let reports:FitReport[]=[];
  let photoTags:PhotoTag[]=[];
  let comments:Comment[]=[];
  let liked=false;let following=false;let viewerBlockedCreator=false;
  const retailerByProduct=new Map<string,string>();
  if(viewerId){
    const [linksResult,likesResult,followResult,blockResult]=await Promise.all([
      supabase.from("outfit_post_items").select("post_id,closet_item_id").eq("post_id",id),
      supabase.from("outfit_likes").select("post_id").eq("post_id",id).eq("user_id",viewerId).maybeSingle(),
      viewerId!==outfit.user_id?supabase.from("follows").select("followed_id").eq("follower_id",viewerId).eq("followed_id",outfit.user_id).maybeSingle():Promise.resolve({data:null,error:null}),
      viewerId!==outfit.user_id?supabase.from("member_blocks").select("blocked_id").eq("blocker_id",viewerId).eq("blocked_id",outfit.user_id).maybeSingle():Promise.resolve({data:null,error:null}),
    ]);
    if(linksResult.error)throw new Error("Could not load tagged garments.");
    garmentLinks=linksResult.data??[];
    liked=Boolean(likesResult.data);following=Boolean(followResult.data);viewerBlockedCreator=Boolean(blockResult.data);
    const closetIds=garmentLinks.map((row)=>row.closet_item_id);
    if(closetIds.length){
      const {data,error}=await supabase.from("fit_reports").select("closet_item_id,size_label,fit,created_at,product:products(id,name,slug,retailer_url,brand:brands(name))").in("closet_item_id",closetIds).order("created_at",{ascending:false});
      if(error)throw new Error("Could not load Outfit garment details.");
      reports=(data??[]) as FitReport[];
    }
    if(photoRows.length){const {data,error}=await supabase.from("outfit_photo_tags").select("photo_id,closet_item_id,x,y").in("photo_id",photoRows.map((row)=>row.id));if(error)throw new Error("Could not load Outfit hotspots.");photoTags=(data??[]) as PhotoTag[];}
    if(outfit.comments_enabled){const {data,error}=await supabase.from("outfit_comments").select("id,user_id,body,created_at,profile:profiles(username,display_name)").eq("post_id",id).order("created_at",{ascending:true}).limit(200);if(error)throw new Error("Could not load Outfit comments.");comments=(data??[]) as Comment[];}
  }

  const latestByCloset=new Map<string,FitReport>();
  for(const report of reports)if(!latestByCloset.has(report.closet_item_id))latestByCloset.set(report.closet_item_id,report);
  const productIds=[...new Set([...latestByCloset.values()].map((report)=>one<Product>(report.product)?.id).filter((value):value is string=>Boolean(value)))];
  if(viewerId&&productIds.length){
    const {data}=await supabase.from("retailer_listings").select("product_id,product_url").in("product_id",productIds);
    for(const row of data??[])if(!retailerByProduct.has(row.product_id)&&row.product_url)retailerByProduct.set(row.product_id,row.product_url);
    for(const report of latestByCloset.values()){const product=one<Product>(report.product);if(product?.retailer_url&&!retailerByProduct.has(product.id))retailerByProduct.set(product.id,product.retailer_url);}
  }
  const garments:GalleryGarment[]=garmentLinks.flatMap((link)=>{const report=latestByCloset.get(link.closet_item_id);const product=one<Product>(report?.product);const brand=one<Brand>(product?.brand);return report&&product?[{id:link.closet_item_id,label:`${brand?.name||"Brand"} · ${product.name}`,detail:`Size ${report.size_label} · ${FIT_LABELS[report.fit]||report.fit}`,href:`/item/${product.slug}`}]:[];});
  const galleryPhotos:GalleryPhoto[]=photoRows.flatMap((photo)=>{const url=photoUrls.get(photo.id);return url?[{id:photo.id,url,tags:photoTags.filter((tag)=>tag.photo_id===photo.id).map((tag)=>({closetItemId:tag.closet_item_id,x:Number(tag.x),y:Number(tag.y)}))}]:[];});
  const returnTo=`/outfits/${id}`;
  const publishedAt=outfit.published_at||outfit.created_at;
  const published=first(query.published)==="1";const updated=first(query.updated)==="1";const reported=first(query.reported)==="1";const commentError=first(query.comment_error)==="1";

  return <main className="pageShell">
    {published?<div className="authMessage">Outfit published.</div>:updated?<div className="authMessage">Outfit updated.</div>:reported?<div className="authMessage">Report sent.</div>:null}
    <div className={styles.detailHeader}>
      <div><span className="eyebrow">OUTFIT</span><h1>{outfit.headline||"Outfit"}</h1><div className={styles.creatorLine}><span className="avatar small">{creatorName.slice(0,1).toUpperCase()}</span><div><strong>{creatorName}</strong>{profile?.username?<span>@{profile.username}</span>:null}<span>{formatDate(publishedAt)}</span></div></div></div>
      <div className={styles.detailHeaderActions}><OutfitEngagementClient postId={id} headline={outfit.headline||"Outfit"}/>{owner?<Link className="secondaryButton" href={`/outfits/new?edit=${id}`}>Edit Outfit</Link>:null}</div>
    </div>

    <div className={styles.detailLayout}>
      <OutfitGallery photos={galleryPhotos} garments={garments} canViewTags={Boolean(viewerId)}/>
      <aside className={styles.storyCard}>
        <div className={styles.pills}>{(occasionsResult.data??[]).map((row)=><span key={row.occasion}>{OUTFIT_OCCASION_LABELS.get(row.occasion)??row.occasion}</span>)}</div>
        {(stylesResult.data??[]).length?<div className={styles.styleLine}>{(stylesResult.data??[]).map((row)=><span key={row.display_tag}>#{row.display_tag}</span>)}</div>:null}
        {outfit.story?<p className={styles.storyText}>{outfit.story}</p>:<p className="muted">No Outfit Story added.</p>}
        <div className={styles.engagementCounts}><span>♥ {outfit.like_count}</span><span>💬 {outfit.comment_count}</span><span>↗ {outfit.share_count}</span></div>
        {!viewerId?<div className={styles.memberGate}><strong>Want the garment details?</strong><p>Sign in to view the tagged products, sizes worn, Fit Results, photo hotspots, and comments.</p><Link className="primaryButton" href={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in to explore the look →</Link></div>:null}
        {viewerId&&!owner&&!viewerBlockedCreator?<div className={styles.socialActions}><form action={liked?unlikeOutfit:likeOutfit}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit" className={liked?styles.likedButton:styles.likeButton}>{liked?"♥ Liked":"♡ Like"}</button></form>{!following?<form action={followFromOutfit}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit">Follow {creatorName}</button></form>:<span className={styles.followingBadge}>Following</span>}</div>:null}
        {owner?<div className={styles.ownerTools}><h3>Creator analytics</h3><div className={styles.analyticsGrid}><div><strong>{outfit.view_count}</strong><span>Views</span></div><div><strong>{outfit.like_count}</strong><span>Likes</span></div><div><strong>{outfit.comment_count}</strong><span>Comments</span></div><div><strong>{outfit.share_count}</strong><span>Shares</span></div><div><strong>{outfit.follows_generated_count}</strong><span>Follows generated</span></div></div><p className="fieldHelp">Shop clicks are tracked internally by LikeSized and are not creator-facing in V1.</p><form action={toggleOutfitComments}><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><input type="hidden" name="enabled" value={String(!outfit.comments_enabled)}/><button type="submit">{outfit.comments_enabled?"Turn comments off":"Turn comments on"}</button></form></div>:null}
      </aside>
    </div>

    {viewerId?<section className={styles.lookSection}><div className={styles.sectionHeading}><div><span className="eyebrow">EXPLORE THIS LOOK</span><h2>Tagged garments</h2></div></div><div className={styles.lookGrid}>{garments.map((garment)=>{const report=latestByCloset.get(garment.id)!;const product=one<Product>(report.product)!;const shop=retailerByProduct.get(product.id);return <article className={styles.lookCard} key={garment.id}><div><strong>{garment.label}</strong><span>{garment.detail}</span></div><div className={styles.lookActions}><Link href={garment.href}>View Product</Link>{shop?<Link className="primaryButton" href={`/api/outfits/${id}/shop?product_id=${product.id}`}>Shop</Link>:null}</div></article>;})}</div></section>:null}

    {viewerId?<section className={styles.commentsSection}><div className={styles.sectionHeading}><div><span className="eyebrow">COMMENTS</span><h2>{outfit.comments_enabled?`${outfit.comment_count} ${outfit.comment_count===1?"comment":"comments"}`:"Comments are off"}</h2></div></div>{outfit.comments_enabled?<><CommentComposer postId={id} returnTo={returnTo}/>{commentError?<div className="authMessage error">Comment must be plain text, 500 characters or less, with no external links.</div>:null}<div className={styles.commentList}>{comments.map((comment)=>{const author=one<Profile>(comment.profile);const authorName=author?.display_name?.trim()||author?.username||"LikeSized member";const canDelete=owner||comment.user_id===viewerId;return <article className={styles.comment} key={comment.id}><div><strong>{authorName}</strong><span>{formatDate(comment.created_at)}</span></div><p>{comment.body}</p><div className={styles.commentActions}>{canDelete?<form action={deleteOutfitComment}><input type="hidden" name="comment_id" value={comment.id}/><input type="hidden" name="post_id" value={id}/><input type="hidden" name="return_to" value={returnTo}/><button type="submit">Delete</button></form>:null}{comment.user_id!==viewerId?<ReportContentForm targetType="outfit_comment" targetId={comment.id} returnTo={returnTo}/>:null}</div></article>;})}</div></>:<p className="muted">The creator turned comments off. Existing comments are preserved and will return if comments are turned back on.</p>}</section>:null}

    {viewerId&&!owner?<section className={styles.safetyRow}><ReportContentForm targetType="outfit_post" targetId={id} returnTo={returnTo}/><form action={blockMemberFromOutfit}><input type="hidden" name="member_id" value={outfit.user_id}/><button type="submit">Block member</button></form></section>:null}
    {owner?<section className={styles.dangerZone}><form action={deleteOutfit}><input type="hidden" name="post_id" value={id}/><button type="submit">Delete Outfit</button></form></section>:null}
  </main>;
}
