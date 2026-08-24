import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { followPerson, setFollowingNotificationSubscription, unfollowPerson } from "@/app/people/actions";
import { fitTwinDesignation, fitTwinLabel } from "@/lib/fit-twin";
import { createClient } from "@/lib/supabase/server";

type Params=Promise<{username:string}>;
type ProfileRecord={id:string;username:string;display_name:string|null;bio:string|null;avatar_url:string|null};
type MatchRecord={user_id:string;match_score:number};
type ReportRecord={id:string;closet_item_id:string;size_label:string;fit:string;would_buy_again:boolean|null;created_at:string;product:unknown};
type ProductRecord={name:string;slug:string;category:string;garment_type_key:string|null;brand:unknown};
type BrandRecord={name:string};
type FitPhoto={closet_item_id:string;storage_path:string};
type DimensionRow={fit_report_id:string;dimension_key:string;response_key:string};
type DimensionLabel={key:string;label:string};
type ResponseLabel={dimension_key:string;response_key:string;label:string};
type HistoricalMatch={fit_report_id:string;historical_match_score:number;historical_coverage_percent:number};
type NotificationSubscription={followed_id:string};
const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function dateLabel(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value));}

async function scoreFor(supabase:Awaited<ReturnType<typeof createClient>>,targetUserId:string,category:"overall"|"tops"|"bottoms"){
  const {data,error}=await supabase.rpc("get_fit_matches",{p_match_category:category,p_result_limit:100});
  if(error)throw error;
  return ((data??[]) as MatchRecord[]).find((row)=>row.user_id===targetUserId)?.match_score;
}

export default async function MemberProfilePage({params}:{params:Params}){
  const {username}=await params;
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  if(claimsError||!viewerId)redirect(`/login?next=${encodeURIComponent(`/people/${username}`)}`);

  const {data:profileData,error:profileError}=await supabase.from("profiles").select("id,username,display_name,bio,avatar_url").eq("username",username).maybeSingle();
  if(profileError)throw new Error("Could not load member profile.");
  if(!profileData)notFound();
  const profile=profileData as ProfileRecord;
  const isSelf=profile.id===viewerId;

  const [{data:reportsData,error:reportsError},{data:followData,error:followError},{data:notificationData,error:notificationError},{data:twinSettings,error:twinSettingsError},overall,tops,bottoms]=await Promise.all([
    supabase.from("fit_reports").select("id,closet_item_id,size_label,fit,would_buy_again,created_at,product:products(name,slug,category,garment_type_key,brand:brands(name))").eq("user_id",profile.id).order("created_at",{ascending:false}).limit(50),
    isSelf?Promise.resolve({data:null,error:null}):supabase.from("follows").select("followed_id").eq("follower_id",viewerId).eq("followed_id",profile.id).maybeSingle(),
    isSelf?Promise.resolve({data:[],error:null}):supabase.rpc("get_following_notification_subscriptions"),
    isSelf?Promise.resolve({data:null,error:null}):supabase.from("fit_twin_settings").select("threshold_percent").eq("singleton",true).maybeSingle(),
    isSelf?Promise.resolve(undefined):scoreFor(supabase,profile.id,"overall"),
    isSelf?Promise.resolve(undefined):scoreFor(supabase,profile.id,"tops"),
    isSelf?Promise.resolve(undefined):scoreFor(supabase,profile.id,"bottoms"),
  ]);
  if(reportsError||followError||notificationError||twinSettingsError)throw new Error("Could not load member fit evidence.");

  const reports=(reportsData??[]) as ReportRecord[];
  const closetIds=[...new Set(reports.map((row)=>row.closet_item_id))];
  const reportIds=reports.map((row)=>row.id);
  let photos:FitPhoto[]=[];
  let dimensions:DimensionRow[]=[];
  let dimensionLabels:DimensionLabel[]=[];
  let responseLabels:ResponseLabel[]=[];
  let historicalMatches:HistoricalMatch[]=[];

  if(closetIds.length){
    const {data,error}=await supabase.from("fit_reference_photos").select("closet_item_id,storage_path").in("closet_item_id",closetIds);
    if(error)throw new Error("Could not load fit photos.");
    photos=(data??[]) as FitPhoto[];
  }

  if(reportIds.length){
    const [{data:dimData,error:dimError},{data:defData},{data:respData},{data:historyData,error:historyError}]=await Promise.all([
      supabase.from("fit_report_dimensions").select("fit_report_id,dimension_key,response_key").in("fit_report_id",reportIds),
      supabase.from("fit_dimension_definitions").select("key,label"),
      supabase.from("fit_dimension_responses").select("dimension_key,response_key,label"),
      supabase.rpc("get_fit_report_snapshot_matches",{p_fit_report_ids:reportIds}),
    ]);
    if(dimError||historyError)throw new Error("Could not load historical fit evidence.");
    dimensions=(dimData??[]) as DimensionRow[];
    dimensionLabels=(defData??[]) as DimensionLabel[];
    responseLabels=(respData??[]) as ResponseLabel[];
    historicalMatches=(historyData??[]) as HistoricalMatch[];
  }

  const photoPathByCloset=new Map(photos.map((row)=>[row.closet_item_id,row.storage_path]));
  const photoUrlByCloset=new Map<string,string>();
  await Promise.all(reports.map(async(row)=>{
    const path=photoPathByCloset.get(row.closet_item_id);
    if(!path)return;
    const {data:signed}=await supabase.storage.from("fit-reference-photos").createSignedUrl(path,60*30);
    if(signed?.signedUrl)photoUrlByCloset.set(row.closet_item_id,signed.signedUrl);
  }));

  let profilePhotoUrl:string|null=null;
  if(profile.avatar_url){
    const {data:signed}=await supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_url,60*30);
    profilePhotoUrl=signed?.signedUrl??null;
  }

  const dimensionName=new Map(dimensionLabels.map((row)=>[row.key,row.label]));
  const responseName=new Map(responseLabels.map((row)=>[`${row.dimension_key}:${row.response_key}`,row.label]));
  const dimsByReport=new Map<string,DimensionRow[]>();
  dimensions.forEach((row)=>dimsByReport.set(row.fit_report_id,[...(dimsByReport.get(row.fit_report_id)??[]),row]));
  const historyByReport=new Map(historicalMatches.map((row)=>[row.fit_report_id,row]));
  const followed=Boolean(followData);
  const notificationsOn=((notificationData??[]) as NotificationSubscription[]).some((row)=>row.followed_id===profile.id);
  const name=profile.display_name?.trim()||profile.username;
  const returnTo=`/people/${profile.username}`;
  const twinDesignation=!isSelf&&followed?fitTwinDesignation({overall,tops,bottoms},twinSettings?.threshold_percent??85):null;
  const twinLabel=fitTwinLabel(twinDesignation);

  return <main className="pageShell">
    <div className="pageTitle">
      {profilePhotoUrl?<img className="avatar photoAvatar profileAvatar" src={profilePhotoUrl} alt={`${name} profile`}/>:<div className="avatar profileAvatar">{name.slice(0,1).toUpperCase()}</div>}
      <span className="eyebrow">MEMBER PROFILE</span><h1>{name}</h1><p>@{profile.username}{profile.bio?` · ${profile.bio}`:""}{twinLabel?` · ${twinLabel}`:""}</p><p>Current Fit Match scores compare your current bodies. Shared Closet history below stays tied to the body state from each actual try-on. Raw measurements are never shown.</p>
      {!isSelf?<div className="statsRow"><span><b>{typeof overall==="number"?`${overall}%`:"—"}</b> current overall</span><span><b>{typeof tops==="number"?`${tops}%`:"—"}</b> current tops</span><span><b>{typeof bottoms==="number"?`${bottoms}%`:"—"}</b> current bottoms</span></div>:null}
      {!isSelf?<><div className="authActions"><form action={followed?unfollowPerson:followPerson}><input type="hidden" name="target_user_id" value={profile.id}/><input type="hidden" name="return_to" value={returnTo}/><button className={followed?"secondaryButton":"primaryButton"} type="submit">{followed?"Unfollow":"Follow"}</button></form><form action={setFollowingNotificationSubscription}><input type="hidden" name="target_user_id" value={profile.id}/><input type="hidden" name="enabled" value={notificationsOn?"false":"true"}/><input type="hidden" name="return_to" value={returnTo}/><button className={notificationsOn?"primaryButton":"secondaryButton"} type="submit" aria-pressed={notificationsOn}>{notificationsOn?"🔔 Notifications on":"🔔 Notify me"}</button></form><Link className="secondaryButton" href="/people">Back to matches</Link></div><p className="tiny">Follow adds this member to your Style Feed. Twin designation is automatic for followed people: both regional scores clear the strong-match threshold for Fit Twin; one qualifying region becomes Tops Twin or Bottoms Twin.</p></>:<div className="authActions"><Link className="secondaryButton" href="/settings">Profile & Privacy</Link><Link className="secondaryButton" href="/onboarding">Edit Fit Profile</Link><Link className="secondaryButton" href="/closet">My Closet</Link></div>}
    </div>

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">SHARED FIT HISTORY</span><h2>{isSelf?"Your visible fit-reference history":`${name}'s real garment evidence`}</h2></div></div>
      {reports.length?<div className="evidenceList">{reports.map((report)=>{
        const product=one<ProductRecord>(report.product);
        const brand=one<BrandRecord>(product?.brand);
        const photo=photoUrlByCloset.get(report.closet_item_id);
        const dims=dimsByReport.get(report.id)??[];
        const historical=historyByReport.get(report.id);
        return <div className="evidence" key={report.id}>
          {photo?<img className="garmentPhoto" src={photo} alt="Fit reference"/>:<div className="avatar small">{(brand?.name||product?.name||"F").slice(0,1).toUpperCase()}</div>}
          <div>{product?<Link className="textLink" href={`/item/${product.slug}`}>{product.name}</Link>:<strong>Garment</strong>}<span>{brand?.name||"Brand"}{product?.garment_type_key?` · ${product.garment_type_key.replaceAll("_"," ")}`:""} · Logged {dateLabel(report.created_at)}</span></div>
          <div><span>Size worn then</span><strong>{report.size_label}</strong></div>
          <div><span>Fit Result then</span><strong>{FIT_LABELS[report.fit]||report.fit}</strong></div>
          {!isSelf&&historical?<div><span>Historical body match to you</span><strong>{historical.historical_match_score}%</strong><span>{historical.historical_coverage_percent}% measurement coverage</span></div>:null}
          <div><span>Buy again</span><strong>{report.would_buy_again===true?"Yes":report.would_buy_again===false?"No":"—"}</strong></div>
          {dims.length?<div>{dims.map((dim)=><span key={dim.dimension_key}><b>{dimensionName.get(dim.dimension_key)||dim.dimension_key}:</b> {responseName.get(`${dim.dimension_key}:${dim.response_key}`)||dim.response_key} </span>)}</div>:null}
        </div>;
      })}</div>:<div className="emptyState"><span className="eyebrow">NO SHARED GARMENTS YET</span><h2>No shared fit evidence to show.</h2><p>Shared historical garments and optional fit/reference photos can appear here without exposing body measurements.</p></div>}
    </section>
  </main>;
}
