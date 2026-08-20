import { redirect } from "next/navigation";
import { FitProfileForm, type BodyMeasurement, type MeasurementType, type SizeReference } from "@/app/onboarding/FitProfileForm";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}

export default async function OnboardingPage({searchParams}:{searchParams:SearchParams}){
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/onboarding");

  const [{data:profile},{data:fitProfile},{data:types},{data:measurements},{data:sizeReferences}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("preferred_unit_system,completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("measurement_types").select("key,label,core,measurement_group,dimension,manual_step_imperial,manual_step_metric,sort_order").order("sort_order"),
    supabase.from("body_measurements").select("measurement_type_key,entered_value,entered_unit").eq("user_id",userId),
    supabase.from("user_size_references").select("reference_type,original_size_label,sizing_system,band_size,cup_designation,shoe_size").eq("user_id",userId),
  ]);

  const params=await searchParams;
  const error=first(params.error);
  const errorMessage=error==="invalid_username"?"Choose a display name with 3–32 letters, numbers, or underscores.":error==="username_taken"?"That display name is already taken.":error==="invalid_measurements"?"Check your numeric measurements. Manual values are normalized to the precision defined for each measurement.":error==="invalid_size_references"?"Check your private size references. Bra and shoe references require a complete structured size when entered.":error==="save_failed"?"Your Fit Profile could not be saved.":null;
  const unitSystem=fitProfile?.preferred_unit_system==="metric"?"metric":"imperial";

  return <main className="onboardingShell">
    <section className="onboardingIntro"><span className="eyebrow">FIT PROFILE</span><h1>Personalize LikeSized to fit your needs</h1><p>Your measurements stay 100% private and help LikeSized make smarter fit matches and recommendations. The more information you provide, the more personalized your results become.</p></section>
    <FitProfileForm username={profile?.username??""} unitSystem={unitSystem} types={(types??[]) as MeasurementType[]} measurements={(measurements??[]) as BodyMeasurement[]} sizeReferences={(sizeReferences??[]) as SizeReference[]} errorMessage={errorMessage}/>
  </main>;
}
