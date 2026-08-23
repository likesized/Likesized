import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllFollowingNotificationsRead, markFollowingNotificationRead, markProductEvidenceNotificationRead } from "./actions";
import { createClient } from "@/lib/supabase/server";
import styles from "./notifications.module.css";

type MatchCategory="overall"|"tops"|"bottoms";
type NotificationRow={notification_id:string;activity_id:string;activity_type:"closet_shared"|"fit_report_added"|"outfit_posted";actor_id:string;username:string;display_name:string|null;created_at:string;read_at:string|null;relevant_match_category:MatchCategory;closet_item_id:string|null;fit_report_id:string|null;outfit_post_id:string|null;product_slug:string|null;product_name:string|null;brand_name:string|null;garment_type_key:string|null;size_label:string|null;fit:string|null;fit_notes:string|null;would_buy_again:boolean|null;outfit_caption:string|null;outfit_photo_path:string|null};
type MatchRow={user_id:string;match_score:number};
type SearchParams=Promise<Record<string,string|string[]|undefined>>;
type EvidenceAlert={product_id:string;last_notified_at:string;read_at:string|null;product:unknown};
type AlertProduct={name:string;slug:string;brand:unknown};
type AlertBrand={name:string};
type ActorProfile={id:string;avatar_url:string|null};

const FIT_LABELS:Record<string,string>={too_small:"Too small",snug:"Snug",just_right:"Just right",relaxed:"Relaxed",too_big:"Too big"};
const CATEGORY_LABELS:Record<MatchCategory,string>={overall:"Overall",tops:"Tops",bottoms:"Bottoms"};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function one<T>(value:unknown):T|null{return Array.isArray(value)?((value[0] as T|undefined)??null):((value as T|null)??null);}
function dateLabel(value:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));}
function shortNote(value:string|null){if(!value)return null;return value.length>180?`${value.slice(0,177).trimEnd()}…`:value;}

export default async function NotificationsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const viewerId=claimsData?.claims?.sub;
  if(claimsError||!viewerId)redirect("/login?next=/notifications");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitProfileError},{data:notificationData,error:notificationError},{data:unreadData,error:unreadError},{data:evidenceAlertData,error:evidenceAlertError}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",viewerId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",viewerId).maybeSingle(),
    supabase.rpc("get_fit_twin_activity_notifications",{p_result_limit:50,p_before:null}),
    supabase.rpc("get_fit_twin_notification_unread_count"),
    supabase.from("product_evidence_notifications").select("product_id,last_notified_at,read_at,product:products(name,slug,brand:brands(name))").not("last_notified_at","is",null).order("last_notified_at",{ascending:false}),
  ]);
  if(profileError||fitProfileError||notificationError||unreadError||evidenceAlertError)throw new Error("Could not load notifications.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  const notifications=(notificationData??[]) as NotificationRow[];
  const evidenceAlerts=(evidenceAlertData??[]) as EvidenceAlert[];
  const unreadCount=(typeof unreadData==="number"?unreadData:Number(unreadData??0))+evidenceAlerts.filter((row)=>!row.read_at).length;
  const categories=[...new Set(notifications.map((row)=>row.relevant_match_category))];
  const matchMaps=new Map<MatchCategory,Map<string,number>>();
  await Promise.all(categories.map(async(category)=>{
    const {data,error}=await supabase.rpc("get_fit_matches",{p_match_category:category,p_result_limit:100});
    if(error)return;
    matchMaps.set(category,new Map(((data??[]) as MatchRow[]).map((row)=>[row.user_id,row.match_score])));
  }));

  const actorIds=[...new Set(notifications.map((row)=>row.actor_id))];
  const actorAvatarMap=new Map<string,string>();
  if(actorIds.length){
    const {data:actors,error:actorError}=await supabase.from("profiles").select("id,avatar_url").in("id",actorIds);
    if(actorError)throw new Error("Could not load notification profiles.");
    await Promise.all(((actors??[]) as ActorProfile[]).map(async(actor)=>{
      if(!actor.avatar_url)return;
      const {data:signed}=await supabase.storage.from("profile-photos").createSignedUrl(actor.avatar_url,60*30);
      if(signed?.signedUrl)actorAvatarMap.set(actor.id,signed.signedUrl);
    }));
  }

  const params=await searchParams;
  const readState=first(params.read);
  const readError=first(params.error)==="read_failed";

  return <main className="pageShell">
    <div className="pageTitle">
      <span className="eyebrow">NOTIFICATIONS</span>
      <h1>What’s new for you.</h1>
      <p>Updates from people you follow and products you’re watching.</p>
      <div className={styles.toolbar}>
        <Link className="secondaryButton" href="/outfits?feed=following">Style Feed</Link>
        <Link className="secondaryButton" href="/settings#notifications">Notification settings</Link>
        {unreadCount>0?<form action={markAllFollowingNotificationsRead}><button className="primaryButton" type="submit">Mark all read ({unreadCount})</button></form>:null}
      </div>
    </div>

    {readState==="all"?<div className="authMessage">Notifications marked read.</div>:null}
    {readError?<div className="authMessage error">Notification read state could not be updated.</div>:null}

    {evidenceAlerts.length?<section><div className="sectionHeading"><div><span className="eyebrow">PRODUCT UPDATES</span><h2>New Fit Reports for products you’re watching</h2></div></div><div className={styles.list}>{evidenceAlerts.map((row)=>{const product=one<AlertProduct>(row.product);const brand=one<AlertBrand>(product?.brand);return <article className={`${styles.card} ${row.read_at?"":styles.unread}`} key={row.product_id}><div className={styles.avatar}>FIT</div><div><div className={styles.top}><div><strong>{brand?.name?`${brand.name} · `:""}{product?.name||"Product"}</strong><span className={styles.time}>{dateLabel(row.last_notified_at)}</span></div>{!row.read_at?<span className={styles.newBadge}>New</span>:null}</div><p className={styles.message}>New Fit Report evidence is available for this product.</p><div className={styles.actions}>{product?<Link className="textLink" href={`/item/${product.slug}`}>View product →</Link>:null}{!row.read_at?<form action={markProductEvidenceNotificationRead}><input type="hidden" name="product_id" value={row.product_id}/><button className={styles.readButton}>Mark read</button></form>:null}</div></div></article>})}</div></section>:null}

    {notifications.length?<section><div className="sectionHeading"><div><span className="eyebrow">FOLLOWING ACTIVITY</span><h2>Updates from people you follow</h2></div></div><div className={styles.list}>{notifications.map((row)=>{
      const name=row.display_name?.trim()||row.username;
      const category=row.relevant_match_category;
      const score=matchMaps.get(category)?.get(row.actor_id);
      const note=shortNote(row.fit_notes);
      const product=[row.brand_name,row.product_name].filter(Boolean).join(" · ")||"a garment";
      const avatarUrl=actorAvatarMap.get(row.actor_id);
      return <article className={`${styles.card} ${row.read_at?"":styles.unread}`} key={row.notification_id}>
        <div className={styles.avatar}>{avatarUrl?<img className={styles.avatarImage} src={avatarUrl} alt=""/>:name.slice(0,1).toUpperCase()}</div>
        <div>
          <div className={styles.top}>
            <div>
              <div className={styles.identity}><Link className="textLink" href={`/people/${row.username}`}><strong>{name}</strong></Link><span className={styles.handle}>@{row.username}</span></div>
              <span className={styles.time}>{dateLabel(row.created_at)}</span>
            </div>
            <div className={styles.badges}>{!row.read_at?<span className={styles.newBadge}>New</span>:null}{typeof score==="number"?<span className={styles.badge}>{score}% {CATEGORY_LABELS[category]} Fit Match</span>:null}</div>
          </div>

          {row.activity_type==="closet_shared"?<p className={styles.message}>Posted <strong>{product}</strong>{row.size_label?` in size ${row.size_label}`:""}{row.fit?` · ${FIT_LABELS[row.fit]||row.fit}`:""}.</p>:null}
          {row.activity_type==="fit_report_added"?<p className={styles.message}>Updated their Fit Report for <strong>{product}</strong>{row.size_label?` in size ${row.size_label}`:""}{row.fit?` · ${FIT_LABELS[row.fit]||row.fit}`:""}.</p>:null}
          {row.activity_type==="outfit_posted"?<p className={styles.message}>Posted a new outfit{row.outfit_caption?`: “${row.outfit_caption}”`:"."}</p>:null}
          {note?<p className={styles.note}>“{note}”</p>:null}

          <div className={styles.actions}>
            {row.activity_type==="outfit_posted"?<Link className="textLink" href="/outfits?feed=following">View outfit →</Link>:<Link className="textLink" href={`/people/${row.username}`}>View profile →</Link>}
            {row.product_slug?<Link className="textLink" href={`/item/${row.product_slug}`}>View product →</Link>:null}
            {!row.read_at?<form action={markFollowingNotificationRead}><input type="hidden" name="notification_id" value={row.notification_id}/><button className={styles.readButton} type="submit">Mark read</button></form>:null}
          </div>
        </div>
      </article>;
    })}</div></section>:!evidenceAlerts.length?<div className="emptyState"><span className="eyebrow">NO NOTIFICATIONS YET</span><h2>Nothing new yet.</h2><p>Updates from people you follow and products you’re watching will appear here.</p><Link className="primaryButton" href="/outfits?feed=following">Open Style Feed →</Link></div>:null}
  </main>;
}
