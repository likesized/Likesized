import { redirect } from "next/navigation";
import { FitProfileForm, type BodyMeasurement, type MeasurementType } from "@/app/onboarding/FitProfileForm";
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
    supabase.from("measurement_types").select("key,label,core,measurement_group,dimension,manual_step_imperial,manual_step_metric,sort_order").order("sort_order"),
    supabase.from("body_measurements").select("measurement_type_key,entered_value,entered_unit").eq("user_id",userId),
  ]);

  const params=await searchParams;
  const error=first(params.error);
  const errorMessage=error==="invalid_username"?"Choose a username with 3–32 letters, numbers, or underscores.":error==="username_taken"?"That username is already taken.":error==="invalid_measurements"?"Check your numeric measurements. Manual values are normalized to the precision defined for each measurement.":error==="save_failed"?"Your Fit Profile could not be saved.":null;
  const unitSystem=fitProfile?.preferred_unit_system==="metric"?"metric":"imperial";

  return <main className="onboardingShell">
    <section className="onboardingIntro"><span className="eyebrow">FIT PROFILE</span><h1>{fitProfile?.completed_at?"Keep your fit data current.":"Start with the measurements clothing actually cares about."}</h1><p>Raw measurements are private. LikeSized uses controlled measurement types and garment-specific weighting to return safe Fit Match percentages.</p><div className="privacyNote"><b>Precision:</b> ordinary manual body measurements use sensible increments—quarter-inch where designated—not meaningless decimal precision.</div></section>
    <FitProfileForm username={profile?.username??""} unitSystem={unitSystem} types={(types??[]) as MeasurementType[]} measurements={(measurements??[]) as BodyMeasurement[]} errorMessage={errorMessage}/>
  </main>;
}
