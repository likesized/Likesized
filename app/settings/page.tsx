import { redirect } from "next/navigation";
import { saveFollowingNotificationSettings } from "@/app/settings/actions";
import { ProfileSettingsForm } from "@/app/settings/ProfileSettingsForm";
import styles from "@/app/settings/settings.module.css";
import { createClient } from "@/lib/supabase/server";

type SearchParams=Promise<Record<string,string|string[]|undefined>>;type FitCommunity="men"|"women"|"both";
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}function communityValue(value:unknown):FitCommunity{return value==="men"||value==="women"?value:"both";}

export default async function SettingsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();const userId=claimsData?.claims?.sub;if(claimsError||!userId)redirect("/login?next=/settings");
  const [{data:profile,error:profileError},{data:fitProfile,error:fitError},{data:notificationSettings,error:notificationSettingsError},{data:location,error:locationError},{data:usernameStatus,error:usernameStatusError}]=await Promise.all([
    supabase.from("profiles").select("username,display_name,bio,avatar_url").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at,fit_community").eq("user_id",userId).maybeSingle(),
    supabase.rpc("get_fit_twin_notification_settings"),
    supabase.from("profile_locations").select("city,state_region").eq("user_id",userId).maybeSingle(),
    supabase.rpc("get_username_change_status",{p_username:null}),
  ]);
  if(profileError||fitError||notificationSettingsError||locationError)throw new Error("Could not load profile settings.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");
  let currentPhotoUrl:string|null=null;if(profile.avatar_url){const {data:signed}=await supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_url,60*30);currentPhotoUrl=signed?.signedUrl??null;}
  const params=await searchParams;const profileSaved=first(params.profile)==="saved";const usernameSaved=first(params.username)==="saved";const notificationState=first(params.notifications);const error=first(params.error);
  const errorMessage=error==="invalid_profile"?"Display name or bio is too long.":error==="invalid_location"?"City and state are required.":error==="invalid_fit_community"?"Choose Men, Women, or Both for your Fit Community.":error==="invalid_profile_photo"?"Choose a valid profile photo and try again.":error==="profile_save_failed"?"Your profile changes could not be saved.":error==="invalid_username"?"Username must be 3–32 letters, numbers, or underscores.":error==="username_taken"?"That username is not available.":error==="username_cooldown"?"Username can only be changed once every 30 days.":error==="username_save_failed"?"Your username could not be changed.":error==="notification_save_failed"?"Your notification preference could not be saved.":null;
  const notificationsEnabled=notificationSettings?.[0]?.fit_twin_activity_enabled===true;const fitCommunity=communityValue(fitProfile.fit_community);const fallbackInitial=(profile.display_name?.trim()||profile.username).slice(0,1).toUpperCase();
  const usernameRow=!usernameStatusError&&Array.isArray(usernameStatus)?usernameStatus[0]:null;
  return <main className={`pageShell ${styles.settingsPage}`}>
    <header className={styles.settingsHeader}><span className={styles.sectionKicker}>SETTINGS</span><h1>Account settings</h1></header>
    {profileSaved?<div className="authMessage">Profile updated.</div>:null}{usernameSaved?<div className="authMessage">Username updated.</div>:null}{notificationState==="on"?<div className="authMessage">Following notifications turned on.</div>:null}{notificationState==="off"?<div className="authMessage">Following notifications turned off.</div>:null}{errorMessage?<div className="authMessage error">{errorMessage}</div>:null}
    <ProfileSettingsForm username={profile.username} displayName={profile.display_name??""} bio={profile.bio??""} city={location?.city??""} stateRegion={location?.state_region??""} fitCommunity={fitCommunity} currentPhotoUrl={currentPhotoUrl} fallbackInitial={fallbackInitial} usernameCanChange={usernameRow?.can_change!==false} usernameNextChangeAt={typeof usernameRow?.next_change_at==="string"?usernameRow.next_change_at:null}/>
    <section id="notifications" className={styles.secondarySection}><div><span className={styles.sectionKicker}>NOTIFICATIONS</span><h2>Following notifications</h2><p>Control activity alerts for people whose notification bell you turn on.</p></div><form action={saveFollowingNotificationSettings}><input type="hidden" name="enabled" value={notificationsEnabled?"false":"true"}/><button className={styles.notificationButton} type="submit">{notificationsEnabled?"On · Turn off":"Off · Turn on"}</button></form></section>
    <section className={styles.privacyStatement}><span className={styles.sectionKicker}>PRIVACY</span><h2>Your private information stays private.</h2><p>Your exact body measurements and city/state are never shown to other members. Profile details, posted garments, outfits, photos, and LikeSized Match percentages may be visible according to the normal LikeSized sharing rules.</p></section>
  </main>;
}
