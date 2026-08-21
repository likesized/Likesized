import Link from "next/link";
import { redirect } from "next/navigation";
import { likeOutfit, unlikeOutfit } from "@/app/outfits/actions";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import styles from "./outfits.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type OutfitPost={id:string;user_id:string;caption:string|null;photo_url:string;created_at:string;profile:unknown};
type ProfileRecord={username:string;display_name:string|null};
type OutfitItemLink={post_id:string;closet_item_id:string};
type FitReport={id:string;closet_item_id:string;size_label:string;fit:string;created_at:string;product:unknown};
type ProductRecord={name:string;slug:string;brand:unknown};
type BrandRecord={name:string};
type OutfitLike={post_id:string;user_id:string};
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}

export default async function OutfitsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  if(claimsError||!viewerId)redirect("/login?next=/outfits");

  const params=await searchParams;
  const posted=first(params.posted)==="1";
  const feed=first(params.feed)==="following"?"following":"all";
  let followedIds:string[]=[];
  if(feed==="following"){
    const {data,error}=await supabase.from("follows").select("followed_id").eq("follower_id",viewerId);
    if(error)throw new Error("Could not load people you follow.");
    followedIds=(data??[]).map((row)=>row.followed_id);
  }

  let posts:OutfitPost[]=[];
  if(feed==="all"||followedIds.length){
    let query=supabase.from("outfit_posts").select("id,user_id,caption,photo_url,created_at,profile:profiles(username,display_name)").order("created_at",{ascending:false}).limit(50);
    if(feed==="following")query=query.in("user_id",followedIds);
    const {data,error}=await query;
    if(error)throw new Error("Could not load outfits.");
    posts=(data??[]) as OutfitPost[];
  }

  const postIds=posts.map((post)=>post.id);
  let links:OutfitItemLink[]=[];
  let likes:OutfitLike[]=[];
  if(postIds.length){
    const [{data:linkData,error:linkError},{data:likeData,error:likeError}]=await Promise.all([
      supabase.from("outfit_post_items").select("post_id,closet_item_id").in("post_id",postIds),
      supabase.from("outfit_likes").select("post_id,user_id").in("post_id",postIds),
    ]);
    if(linkError||likeError)throw new Error("Could not load outfit details.");
    links=(linkData??[]) as OutfitItemLink[];
    likes=(likeData??[]) as OutfitLike[];
  }

  const closetItemIds=[...new Set(links.map((link)=>link.closet_item_id))];
  let reports:FitReport[]=[];
  if(closetItemIds.length){
    const {data,error}=await supabase.from("fit_reports").select("id,closet_item_id,size_label,fit,created_at,product:products(name,slug,brand:brands(name))").in("closet_item_id",closetItemIds).order("created_at",{ascending:false});
    if(error)throw new Error("Could not load outfit fit evidence.");
    reports=(data??[]) as FitReport[];
  }

  const latestReportByClosetItem=new Map<string,FitReport>();
  for(const report of reports)if(!latestReportByClosetItem.has(report.closet_item_id))latestReportByClosetItem.set(report.closet_item_id,report);
  const itemIdsByPost=new Map<string,string[]>();
  for(const link of links){const ids=itemIdsByPost.get(link.post_id)??[];ids.push(link.closet_item_id);itemIdsByPost.set(link.post_id,ids);}
  const likeCountByPost=new Map<string,number>();
  const likedByViewer=new Set<string>();
  for(const like of likes){likeCountByPost.set(like.post_id,(likeCountByPost.get(like.post_id)??0)+1);if(like.user_id===viewerId)likedByViewer.add(like.post_id);}

  const signedPhotoByPost=new Map<string,string>();
  await Promise.all(posts.map(async(post)=>{const feedPath=outfitFeedPhotoPath(post.photo_url);let {data}=await supabase.storage.from("outfit-photos").createSignedUrl(feedPath,60*60);if(!data?.signedUrl&&feedPath!==post.photo_url){({data}=await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url,60*60));}if(data?.signedUrl)signedPhotoByPost.set(post.id,data.signedUrl);}));
  const returnTo=feed==="following"?"/outfits?feed=following":"/outfits";

  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">OUTFITS</span><h1>Real clothes on real Fit Profiles.</h1><p>Member outfits connect what people wear back to exact products, purchased sizes, and reported fit—without exposing body measurements.</p></div><Link className="primaryButton" href="/outfits/new">+ Post outfit</Link></div>
    <nav className={styles.feedTabs} aria-label="Outfit feed"><Link className={feed==="all"?styles.activeTab:styles.tab} href="/outfits">All outfits</Link><Link className={feed==="following"?styles.activeTab:styles.tab} href="/outfits?feed=following">Following</Link></nav>
    {posted?<div className="authMessage">Outfit posted.</div>:null}

    {posts.length?<div className={styles.feed}>{posts.map((post)=>{
      const profile=one<ProfileRecord>(post.profile);
      const name=profile?.display_name?.trim()||profile?.username||"LikeSized member";
      const signedPhoto=signedPhotoByPost.get(post.id);
      const taggedReports=(itemIdsByPost.get(post.id)??[]).map((id)=>latestReportByClosetItem.get(id)).filter((report):report is FitReport=>Boolean(report));
      const liked=likedByViewer.has(post.id);
      const likeCount=likeCountByPost.get(post.id)??0;
      return <article className={styles.post} key={post.id}>
        <div className={styles.postHeader}><div className="avatar small">{name.slice(0,1).toUpperCase()}</div><div>{profile?.username?<Link className="textLink" href={`/people/${profile.username}`}>{name}</Link>:<strong>{name}</strong>}<span className="muted">{new Date(post.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span></div></div>
        {signedPhoto?<img className={styles.photo} src={signedPhoto} alt={post.caption?`Outfit posted by ${name}`:`Outfit by ${name}`}/>:<div className={styles.photoFallback}>Photo unavailable</div>}
        <div className={styles.body}>
          <div className={styles.socialRow}><form action={liked?unlikeOutfit:likeOutfit}><input type="hidden" name="post_id" value={post.id}/><input type="hidden" name="return_to" value={returnTo}/><button className={liked?styles.likedButton:styles.likeButton} type="submit" aria-pressed={liked}>{liked?"♥ Liked":"♡ Like"}</button></form><span>{likeCount} {likeCount===1?"like":"likes"}</span></div>
          {post.caption?<p>{post.caption}</p>:null}
          <div className={styles.tags}>{taggedReports.map((report)=>{const product=one<ProductRecord>(report.product);const brand=one<BrandRecord>(product?.brand);return product?<Link className={styles.tag} href={`/item/${product.slug}`} key={report.closet_item_id}><strong>{brand?.name||"Brand"} · {product.name}</strong><span>Size {report.size_label} · {FIT_LABELS[report.fit]||report.fit}</span></Link>:null;})}</div>
        </div>
      </article>;
    })}</div>:<div className="emptyState"><span className="eyebrow">{feed==="following"?"NO FOLLOWED OUTFITS YET":"NO OUTFITS YET"}</span><h2>{feed==="following"?"The people you follow haven't posted an outfit yet.":"Be the first to connect a look to real fit evidence."}</h2><p>{feed==="following"?"Follow people whose style you want to keep up with. Following is separate from Fit Twin status.":"Post a photo and tag the garments you actually own and wear."}</p>{feed==="following"?<Link className="secondaryButton" href="/people">Find people →</Link>:<Link className="primaryButton" href="/outfits/new">Post an outfit →</Link>}</div>}
  </main>;
}
