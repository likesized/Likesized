import Link from "next/link";
import { redirect } from "next/navigation";
import { outfitFeedPhotoPath } from "@/lib/outfit-photo-paths";
import { createClient } from "@/lib/supabase/server";
import styles from "./following.module.css";

type MatchCategory="overall"|"tops"|"bottoms";
type FeedRow={activity_id:string;activity_type:"closet_shared"|"fit_report_added"|"outfit_posted";actor_id:string;username:string;display_name:string|null;occurred_at:string;relevant_match_category:MatchCategory;closet_item_id:string|null;fit_report_id:string|null;outfit_post_id:string|null;product_slug:string|null;product_name:string|null;brand_name:string|null;garment_type_key:string|null;size_label:string|null;fit:string|null;fit_notes:string|null;would_buy_again:boolean|null;outfit_caption:string|null;outfit_photo_path:string|null};
type MatchRow={user_id:string;match_score:number};
type FitPhoto={closet_item_id:string;storage_path:string};

const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
const CATEGORY_LABELS:Record<MatchCategory,string>={overall:"Overall",tops:"Tops",bottoms:"Bottoms"};
function activityLabel(type:FeedRow["activity_type"]){if(type==="fit_report_added")return "Posted a new fit update";if(type==="outfit_posted")return "Posted a new outfit";return "Added a garment to their Shared Closet";}
function dateLabel(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}
function shortNote(value:string|null){if(!value)return null;return value.length>220?`${value.slice(0,217).trimEnd()}…`:value;}

export default async function FollowingPage(){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  if(claimsError||!viewerId)redirect("/login?next=/following");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitProfileError},{data:feedData,error:feedError}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.rpc("get_following_feed",{p_result_limit:50,p_before:null}),
  ]);
  if(profileError||fitProfileError||feedError)throw new Error("Could not load your Following Feed.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  const feed=(feedData??[]) as FeedRow[];
  const categories=[...new Set(feed.map((row)=>row.relevant_match_category))];
  const matchMaps=new Map<MatchCategory,Map<string,number>>();
  await Promise.all(categories.map(async(category)=>{
    const {data,error}=await supabase.rpc("get_fit_matches",{p_match_category:category,p_result_limit:100});
    if(error)return;
    matchMaps.set(category,new Map(((data??[]) as MatchRow[]).map((row)=>[row.user_id,row.match_score])));
  }));

  const closetIds=[...new Set(feed.map((row)=>row.closet_item_id).filter((id):id is string=>Boolean(id)))];
  let fitPhotos:FitPhoto[]=[];
  if(closetIds.length){
    const {data,error}=await supabase.from("fit_reference_photos").select("closet_item_id,storage_path").in("closet_item_id",closetIds);
    if(!error)fitPhotos=(data??[]) as FitPhoto[];
  }
  const fitPhotoByCloset=new Map(fitPhotos.map((row)=>[row.closet_item_id,row.storage_path]));
  const signedFitPhotoByCloset=new Map<string,string>();
  await Promise.all([...fitPhotoByCloset.entries()].map(async([closetId,path])=>{
    const {data}=await supabase.storage.from("fit-reference-photos").createSignedUrl(path,60*30);
    if(data?.signedUrl)signedFitPhotoByCloset.set(closetId,data.signedUrl);
  }));

  const signedOutfitByPost=new Map<string,string>();
  await Promise.all(feed.filter((row)=>row.outfit_post_id&&row.outfit_photo_path).map(async(row)=>{
    const feedPath=outfitFeedPhotoPath(row.outfit_photo_path!);
    let {data}=await supabase.storage.from("outfit-photos").createSignedUrl(feedPath,60*30);
    if(!data?.signedUrl&&feedPath!==row.outfit_photo_path){({data}=await supabase.storage.from("outfit-photos").createSignedUrl(row.outfit_photo_path!,60*30));}
    if(data?.signedUrl)signedOutfitByPost.set(row.outfit_post_id!,data.signedUrl);
  }));

  return <main className="pageShell">
    <div className="pageTitle">
      <span className="eyebrow">FOLLOWING</span>
      <h1>Keep up with the people you choose to follow.</h1>
      <p>New Shared garments, fit updates, and outfits from people you follow, with current Match context shown when it is available. Following never changes anyone’s Fit Twin status.</p>
      <div className="authActions"><Link className="secondaryButton" href="/people">Find people my size</Link><Link className="secondaryButton" href="/twins">My Fit Twins</Link></div>
    </div>

    {feed.length?<div className={styles.feed}>{feed.map((row)=>{
      const name=row.display_name?.trim()||row.username;
      const category=row.relevant_match_category;
      const score=matchMaps.get(category)?.get(row.actor_id);
      const fitPhoto=row.closet_item_id?signedFitPhotoByCloset.get(row.closet_item_id):undefined;
      const outfitPhoto=row.outfit_post_id?signedOutfitByPost.get(row.outfit_post_id):undefined;
      const note=shortNote(row.fit_notes);
      return <article className={styles.card} key={row.activity_id}>
        <div className={styles.avatar}>{name.slice(0,1).toUpperCase()}</div>
        <div>
          <div className={styles.header}>
            <div>
              <div className={styles.identity}><Link className="textLink" href={`/people/${row.username}`}><strong>{name}</strong></Link><span className={styles.handle}>@{row.username}</span></div>
              <span className={styles.time}>{dateLabel(row.occurred_at)}</span>
            </div>
            <span className={styles.badge}>{typeof score==="number"?`${score}% ${CATEGORY_LABELS[category]} Fit Match`:"Following"}</span>
          </div>
          <div className={styles.activity}>{activityLabel(row.activity_type)}</div>

          {row.activity_type!=="outfit_posted"?<>
            {fitPhoto?<img className={styles.photo} src={fitPhoto} alt={`Fit reference for ${row.product_name||"garment"}`}/>:null}
            <div className={styles.garment}>
              <strong>{row.brand_name?`${row.brand_name} · `:""}{row.product_name||"Shared garment"}</strong>
              <span>{row.size_label?`Size ${row.size_label}`:"Size not listed"}{row.fit?` · ${FIT_LABELS[row.fit]||row.fit}`:""}</span>
              {row.garment_type_key?<span>{row.garment_type_key.replaceAll("_"," ")}</span>:null}
            </div>
            {note?<p className={styles.note}>“{note}”</p>:null}
            <div className={styles.actions}>
              <Link className="textLink" href={`/people/${row.username}`}>View {name} →</Link>
              {row.product_slug?<Link className="textLink" href={`/item/${row.product_slug}`}>View product →</Link>:null}
            </div>
            <div className={styles.context}>The match badge is your current person-to-person Fit Match. The garment evidence stays tied to the body snapshot from that try-on.</div>
          </>:<>
            {outfitPhoto?<img className={styles.photo} src={outfitPhoto} alt={row.outfit_caption?`Outfit posted by ${name}`:`Outfit by ${name}`}/>:null}
            {row.outfit_caption?<p className={styles.outfitCaption}>{row.outfit_caption}</p>:null}
            <div className={styles.actions}><Link className="textLink" href="/outfits?feed=following">View followed outfits →</Link><Link className="textLink" href={`/people/${row.username}`}>View {name} →</Link></div>
          </>}
        </div>
      </article>;
    })}</div>:<div className="emptyState"><span className="eyebrow">NO FOLLOWING ACTIVITY YET</span><h2>Follow people whose style or fit experience you want to keep up with.</h2><p>Following is your choice. It is separate from LikeSized system-generated Fit Twin status.</p><Link className="primaryButton" href="/people">Find people my size →</Link></div>}
  </main>;
}
