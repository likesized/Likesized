import Link from "next/link";
import { redirect } from "next/navigation";
import { saveProfileSettings } from "@/app/settings/actions";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export default async function SettingsPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/settings");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitError},{data:closet,error:closetError}]=await Promise.all([
    supabase.from("profiles").select("username,display_name,bio").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("closet_items").select("visibility").eq("user_id",userId),
  ]);
  if(profileError||fitError||closetError)throw new Error("Could not load profile settings.");
  if(!profile?.username||!fitProfile?.completed_at)redirect("/onboarding");

  const params=await searchParams;
  const saved=first(params.saved)==="1";
  const error=first(params.error);
  const errorMessage=error==="invalid_profile"?"Display name or bio is too long.":error==="save_failed"?"Your profile settings could not be saved.":null;
  const privateCount=(closet??[]).filter((row)=>row.visibility==="private").length;
  const sharedCount=(closet??[]).filter((row)=>row.visibility==="shared").length;

  return <main className="pageShell">
    <div className="pageTitle"><span className="eyebrow">PROFILE & PRIVACY</span><h1>Control what represents you.</h1><p>Your profile identity and your Fit Profile are intentionally separate. Editing your display name or bio never changes body measurements, matching history, or garment evidence.</p></div>

    {saved?<div className="authMessage">Profile settings saved.</div>:null}
    {errorMessage?<div className="authMessage error">{errorMessage}</div>:null}

    <section className="section flush">
      <div className="sectionHeading"><div><span className="eyebrow">PROFILE</span><h2>Member-facing identity</h2></div></div>
      <form className="fitForm" action={saveProfileSettings}>
        <label>Username<div><input value={profile.username} disabled /></div><span className="fieldHelp">Your username is managed with your Fit Profile because it is required for completed-profile identity. <Link className="textLink" href="/onboarding">Edit username →</Link></span></label>
        <label>Display name <span className="muted inlineMuted">optional</span><div><input name="display_name" defaultValue={profile.display_name??""} maxLength={80} placeholder="Name shown on your profile" /></div></label>
        <label>Bio <span className="muted inlineMuted">optional · 300 characters</span><textarea name="bio" defaultValue={profile.bio??""} maxLength={300} rows={4} placeholder="A short profile bio" /></label>
        <div className="privacyNote"><b>Discoverability:</b> completed profiles can be found by username/display name and opened by signed-in LikeSized members only. Public visitors cannot read member profile identity from the database.</div>
        <button type="submit" className="primaryButton">Save profile settings</button>
      </form>
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
