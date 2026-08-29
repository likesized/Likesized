import Link from "next/link";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import styles from "./itemDetail.module.css";

type ReportRow={closet_item_id:string};
type LinkRow={post_id:string};
type PostRow={id:string;photo_url:string;like_count:number;comment_count:number;share_count:number;published_at:string|null;created_at:string};
type PhotoRow={post_id:string;feed_path:string|null;display_path:string;sort_order:number};
const LOOKBACK_DAYS=90,MAX_REPORTS=120,MAX_POSTS=24,DISPLAY_COUNT=3;

export function StyleInspirationFallback(){return <section className={styles.inspirationSection} aria-busy="true"><div className={styles.inspirationHeader}><div><span className="eyebrow">STYLE INSPIRATION</span><h2>See how people are styling this garment.</h2></div></div><div className={styles.inspirationLoading}>Loading recent tagged Outfits…</div></section>;}

export default async function StyleInspiration({productId,productName,variationKey}:{productId:string;productName:string;variationKey:string|null}){
  const supabase=await createClient();
  let reportsQuery=supabase.from("fit_reports").select("closet_item_id").eq("product_id",productId).not("closet_item_id","is",null).order("created_at",{ascending:false}).limit(MAX_REPORTS);if(variationKey)reportsQuery=reportsQuery.eq("tracked_variation_key",variationKey);
  const reportResult=await reportsQuery;if(reportResult.error)return null;const closetIds=[...new Set(((reportResult.data??[]) as ReportRow[]).map((row)=>row.closet_item_id).filter(Boolean))];if(!closetIds.length)return null;
  const linkResult=await supabase.from("outfit_post_items").select("post_id").in("closet_item_id",closetIds).limit(MAX_POSTS*4);if(linkResult.error)return null;const postIds=[...new Set(((linkResult.data??[]) as LinkRow[]).map((row)=>row.post_id))].slice(0,MAX_POSTS*2);if(!postIds.length)return null;
  const cutoff=new Date(Date.now()-LOOKBACK_DAYS*86400000).toISOString();const postResult=await supabase.from("outfit_posts").select("id,photo_url,like_count,comment_count,share_count,published_at,created_at").in("id",postIds).eq("status","published").gte("published_at",cutoff).limit(MAX_POSTS);if(postResult.error)return null;
  const ranked=((postResult.data??[]) as PostRow[]).sort((a,b)=>{const score=(row:PostRow)=>row.like_count+row.comment_count*2+row.share_count*3;return score(b)-score(a)||(b.published_at??b.created_at).localeCompare(a.published_at??a.created_at);});if(!ranked.length)return null;const hasMore=ranked.length>DISPLAY_COUNT;const displayed=ranked.slice(0,DISPLAY_COUNT);
  const photoResult=await supabase.from("outfit_photos").select("post_id,feed_path,display_path,sort_order").in("post_id",displayed.map((post)=>post.id)).eq("bucket","outfit-photos").order("sort_order");const firstPhoto=new Map<string,PhotoRow>();if(!photoResult.error)for(const row of(photoResult.data??[]) as PhotoRow[])if(!firstPhoto.has(row.post_id))firstPhoto.set(row.post_id,row);
  return <section className={styles.inspirationSection}><div className={styles.inspirationHeader}><div><span className="eyebrow">STYLE INSPIRATION</span><h2>See how people are styling this garment.</h2></div>{hasMore?<Link prefetch={false} href={`/explore?item=${encodeURIComponent(productName)}`}>View More in Explore →</Link>:null}</div><div className={styles.inspirationGrid}>{displayed.map((post)=>{const photo=firstPhoto.get(post.id);const path=photo?.feed_path||outfitFeedPhotoPath(photo?.display_path||post.photo_url)||photo?.display_path||post.photo_url;const url=path?supabase.storage.from("outfit-photos").getPublicUrl(path).data.publicUrl:"";return <Link prefetch={false} className={styles.inspirationCard} href={`/outfits/${post.id}`} key={post.id}>{url?<img src={url} alt="Tagged Outfit inspiration" loading="lazy"/>:<span>OUTFIT</span>}</Link>;})}</div></section>;
}
