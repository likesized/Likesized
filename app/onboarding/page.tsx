import { redirect } from "next/navigation";
import { FitProfileForm, type BodyMeasurement, type MeasurementType } from "@/app/onboarding/FitProfileForm";
import heroStyles from "@/app/onboarding/FitProfileHero.module.css";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export default async function OnboardingPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/onboarding");

  const [{data:profile},{data:fitProfile},{data:types},{data:measurements}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("preferred_unit_system,completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("measurement_types").select("key,label,core,measurement_group,dimension,manual_step_imperial,manual_step_metric,reconfirm_after_days,sort_order").order("sort_order"),
    supabase.from("body_measurements").select("measurement_type_key,entered_value,entered_unit,confirmed_at").eq("user_id",userId),
  ]);

  const params=await searchParams;
  const error=first(params.error);
  const errorMessage=error==="invalid_username"?"Choose a username with 3–32 letters, numbers, or underscores.":error==="username_taken"?"That username is already taken. Try another one.":error==="invalid_measurements"?"Check the measurements you entered and try again.":error==="save_failed"?"Your Fit Profile could not be saved.":null;
  const unitSystem=fitProfile?.preferred_unit_system==="metric"?"metric":"imperial";
  const isInitialSetup=!fitProfile?.completed_at;

  return <main className={`onboardingShell ${isInitialSetup?"":heroStyles.revisitShell}`}>
    <section className={`onboardingIntro ${isInitialSetup?"":heroStyles.revisit}`}>
      <span className="eyebrow">FIT PROFILE</span>
      <h1 className={isInitialSetup?undefined:heroStyles.desktopTitle}>Personalize LikeSized to fit your needs</h1>
      {!isInitialSetup?<h1 className={heroStyles.mobileTitle}>Update your Fit Profile</h1>:null}
      <p className={isInitialSetup?undefined:heroStyles.revisitDescription}>Your measurements stay 100% private and help LikeSized make smarter fit matches and recommendations. The more information you provide, the more personalized your results become.</p>
    </section>
    <FitProfileForm username={profile?.username??""} isInitialSetup={isInitialSetup} unitSystem={unitSystem} types={(types??[]) as MeasurementType[]} measurements={(measurements??[]) as BodyMeasurement[]} errorMessage={errorMessage}/>
  </main>;
}