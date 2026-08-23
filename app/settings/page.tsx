import Link from "next/link";
import { redirect } from "next/navigation";
import { saveFollowingNotificationSettings } from "@/app/settings/actions";
import { ProfileIdentityForm } from "@/app/settings/ProfileIdentityForm";
import { ProfilePhotoForm } from "@/app/settings/ProfilePhotoForm";
import { UsernameSettingsForm } from "@/app/settings/UsernameSettingsForm";
import styles from "@/app/settings/settings.module.css";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export default async function SettingsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/settings");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitError},{data:closet,error:closetError},{data:notificationSettings,error:notificationSettingsError}]=await Promise.all([
    supabase.from("profiles").select("username,display_name,bio,avatar_url").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("closet_items").select("visibility").eq("user_id",userId),
    supabase.rpc("get_fit_twin_notification_settings"),
  ]);
  if(profileError||fitError||closetError||notificationSettingsError)throw new Error("Could not load profile settings.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  let currentPhotoUrl:string|null=null;
  if(profile.avatar_url){
    const {data:signed}=await supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_url,60*30);
    currentPhotoUrl=signed?.signedUrl??null;
  }

  const params=await searchParams;
  const saved=first(params.saved)==="1";
  const usernameSaved=first(params.username)==="saved";
  const photoState=first(params.photo);
  const notificationState=first(params.notifications);
  const error=first(params.error);
  const errorMessage=error==="invalid_profile"?"Display name or bio is too long.":error==="save_failed"?"Your profile settings could not be saved.":error==="username_locked"?"Click Change username before editing your username.":error==="invalid_username"?"Choose a username with 3–32 letters, numbers, or underscores.":error==="username_taken"?"That username is already taken or temporarily reserved. Try another one.":error==="username_save_failed"?"Your username could not be changed.":error==="invalid_profile_photo"?"Choose a valid profile photo and try again.":error==="profile_photo_save_failed"?"Your profile photo could not be saved. Try again in a moment.":error==="notification_save_failed"?"Your notification preference could not be saved.":null;
  const privateCount=(closet??[]).filter((row)=>row.visibility==="private").length;
  const sharedCount=(closet??[]).filter((row)=>row.visibility==="shared").length;
  const notificationsEnabled=notificationSettings?.[0]?.fit_twin_activity_enabled!==false;
  const fallbackInitial=(profile.display_name?.trim()||profile.username).slice(0,1).toUpperCase();

  return <main className="pageShell">
    <div className="pageTitle"><span className="eyebrow">PROFILE & PRIVACY</span><h1>Control what represents you.</h1><p>Your profile identity and your Fit Profile are intentionally separate. Editing your username, display name, bio, or profile photo never changes body measurements, matching history, or garment evidence.</p></div>

    {saved?<div className="authMessage">Profile settings saved.</div>:null}
    {usernameSaved?<div className="authMessage">Username updated.</div>:null}
    {photoState==="saved"?<div className="authMessage">Profile photo updated.</div>:null}
    {photoState==="removed"?<div className="authMessage">Profile photo removed.</div>:null}
    {notificationState==="on"?<div className="authMessage">Following activity notifications turned on.</div>:null}
    {notificationState==="off"?<div className="authMessage">Following activity notifications turned off. Your Following Feed is unchanged.</div>:null}
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}

    <section className="section flush">
      <div className="sectionHeading"><div><span className="eyebrow">PROFILE</span><h2>Member-facing identity</h2></div></div>
      <ProfilePhotoForm currentPhotoUrl={currentPhotoUrl} fallbackInitial={fallbackInitial} />
      <ProfileIdentityForm displayName={profile.display_name??""} bio={profile.bio??""} />
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">ACCOUNT</span><h2>Username</h2></div></div>
      <UsernameSettingsForm username={profile.username} />
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">NOTIFICATIONS</span><h2>Following activity alerts</h2></div></div>
      <div className="evidenceList">
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>{notificationsEnabled?"On":"Off"} by default for future activity</strong><span>Alerts cover new Shared Closet garments, new garment fit updates, and new outfits from people you follow. Following is separate from Fit Twin status. Likes never create alerts.</span></div><form action={saveFollowingNotificationSettings}><input type="hidden" name="enabled" value={notificationsEnabled?"false":"true"}/><button className={notificationsEnabled?"secondaryButton":"primaryButton"} type="submit">Turn {notificationsEnabled?"off":"on"}</button></form></div>
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>In-app only in V1</strong><span>No Following activity emails or phone push notifications are sent in V1.</span></div><Link className="secondaryButton" href="/notifications">Open notifications</Link></div>
      </div>
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">PRIVACY</span><h2>What is—and is not—shared</h2></div></div>
      <div className="evidenceList">
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>Always private</strong><span>Exact current body measurements, immutable historical measurements, and preserved normally-worn size references. There is no public-measurement switch.</span></div></div>
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>Profile identity</strong><span>Username, optional display name, optional bio, and optional profile photo are visible to authenticated LikeSized members only.</span></div></div>
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>Closet visibility</strong><span>{privateCount} Private · {sharedCount} Shared. Each garment controls whether its fit evidence can appear to other signed-in members.</span></div><Link className="secondaryButton" href="/closet">Manage Closet</Link></div>
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>Fit/reference photos</strong><span>Uploading one is optional. If you upload one, the garment must be Shared and the photo is visible to authenticated LikeSized members. There is no private fit-photo mode.</span></div></div>
        <div className={`evidence ${styles.settingsEvidence}`}><div><strong>Safe match scores</strong><span>Other members may see derived Fit Match or historical-body-match percentages where appropriate, but never the raw measurements used to calculate them.</span></div></div>
      </div>
    </section>
  </main>;
}
