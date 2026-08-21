import Link from "next/link";
import { redirect } from "next/navigation";
import { saveFitTwinNotificationSettings, saveProfileSettings, saveUsernameSettings } from "@/app/settings/actions";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export default async function SettingsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/settings");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitError},{data:closet,error:closetError},{data:notificationSettings,error:notificationSettingsError}]=await Promise.all([
    supabase.from("profiles").select("username,display_name,bio").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("closet_items").select("visibility").eq("user_id",userId),
    supabase.rpc("get_fit_twin_notification_settings"),
  ]);
  if(profileError||fitError||closetError||notificationSettingsError)throw new Error("Could not load profile settings.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  const params=await searchParams;
  const saved=first(params.saved)==="1";
  const usernameSaved=first(params.username)==="saved";
  const notificationState=first(params.notifications);
  const error=first(params.error);
  const errorMessage=error==="invalid_profile"?"Display name or bio is too long.":error==="save_failed"?"Your profile settings could not be saved.":error==="invalid_username"?"Choose a username with 3–32 letters, numbers, or underscores.":error==="username_taken"?"That username is already taken or temporarily reserved. Try another one.":error==="username_save_failed"?"Your username could not be changed.":error==="notification_save_failed"?"Your notification preference could not be saved.":null;
  const privateCount=(closet??[]).filter((row)=>row.visibility==="private").length;
  const sharedCount=(closet??[]).filter((row)=>row.visibility==="shared").length;
  const notificationsEnabled=notificationSettings?.[0]?.fit_twin_activity_enabled!==false;

  return <main className="pageShell">
    <div className="pageTitle"><span className="eyebrow">PROFILE & PRIVACY</span><h1>Control what represents you.</h1><p>Your profile identity and your Fit Profile are intentionally separate. Editing your username, display name, or bio never changes body measurements, matching history, or garment evidence.</p></div>

    {saved?<div className="authMessage">Profile settings saved.</div>:null}
    {usernameSaved?<div className="authMessage">Username updated.</div>:null}
    {notificationState==="on"?<div className="authMessage">Fit Twin activity notifications turned on.</div>:null}
    {notificationState==="off"?<div className="authMessage">Fit Twin activity notifications turned off. Your Following Feed is unchanged.</div>:null}
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}

    <section className="section flush">
      <div className="sectionHeading"><div><span className="eyebrow">ACCOUNT</span><h2>Username</h2></div></div>
      <form className="fitForm" action={saveUsernameSettings}>
        <label>Username<div><input name="username" type="text" defaultValue={profile.username} minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" autoCapitalize="none" autoCorrect="off" spellCheck={false} required /></div><span className="fieldHelp">3–32 letters, numbers, or underscores. Usernames must be unique. If you change yours, your previous username stays reserved to your account for 30 days.</span></label>
        <button type="submit" className="primaryButton">Change username</button>
      </form>
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">PROFILE</span><h2>Member-facing identity</h2></div></div>
      <form className="fitForm" action={saveProfileSettings}>
        <label>Display name <span className="muted inlineMuted">optional</span><div><input name="display_name" defaultValue={profile.display_name??""} maxLength={80} placeholder="Name shown on your profile" /></div></label>
        <label>Bio <span className="muted inlineMuted">optional · 300 characters</span><textarea name="bio" defaultValue={profile.bio??""} maxLength={300} rows={4} placeholder="A short profile bio" /></label>
        <div className="privacyNote"><b>Discoverability:</b> completed profiles can be found by username/display name and opened by signed-in LikeSized members only. Public visitors cannot read member profile identity from the database.</div>
        <button type="submit" className="primaryButton">Save profile settings</button>
      </form>
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">NOTIFICATIONS</span><h2>Fit Twin activity alerts</h2></div></div>
      <div className="evidenceList">
        <div className="evidence"><div><strong>{notificationsEnabled?"On":"Off"} by default for future activity</strong><span>Alerts cover new Shared Closet garments, new Fit Reports/re-try-ons, and new outfits from Fit Twins. Likes never create alerts.</span></div><form action={saveFitTwinNotificationSettings}><input type="hidden" name="enabled" value={notificationsEnabled?"false":"true"}/><button className={notificationsEnabled?"secondaryButton":"primaryButton"} type="submit">Turn {notificationsEnabled?"off":"on"}</button></form></div>
        <div className="evidence"><div><strong>Per-Fit-Twin mute</strong><span>Mute one Fit Twin without unfollowing them. Their Shared activity still appears in your Following Feed; only future alerts stop.</span></div><Link className="secondaryButton" href="/twins">Manage Fit Twins</Link></div>
        <div className="evidence"><div><strong>In-app only in V1</strong><span>No Fit Twin activity emails or phone push notifications are sent in V1.</span></div><Link className="secondaryButton" href="/notifications">Open notifications</Link></div>
      </div>
    </section>

    <section className="section">
      <div className="sectionHeading"><div><span className="eyebrow">PRIVACY</span><h2>What is—and is not—shared</h2></div></div>
      <div className="evidenceList">
        <div className="evidence"><div><strong>Always private</strong><span>Exact current body measurements, immutable historical measurements, and normally-worn size references. There is no public-measurement switch.</span></div></div>
        <div className="evidence"><div><strong>Profile identity</strong><span>Username, optional display name, and optional bio are visible to authenticated LikeSized members only. Avatar editing is not exposed until LikeSized has an intentional avatar-storage model.</span></div></div>
        <div className="evidence"><div><strong>Closet visibility</strong><span>{privateCount} Private · {sharedCount} Shared. Each garment controls whether its fit evidence can appear to other signed-in members.</span></div><Link className="secondaryButton" href="/closet">Manage Closet</Link></div>
        <div className="evidence"><div><strong>Fit/reference photos</strong><span>Uploading one is optional. If you upload one, the garment must be Shared and the photo is visible to authenticated LikeSized members. There is no private fit-photo mode.</span></div></div>
        <div className="evidence"><div><strong>Safe match scores</strong><span>Other members may see derived Fit Match or historical-body-match percentages where appropriate, but never the raw measurements used to calculate them.</span></div></div>
      </div>
    </section>
  </main>;
}
