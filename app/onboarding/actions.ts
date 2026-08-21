"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MeasurementType = { key:string; dimension:"length"|"weight" };
type ExistingSizeReference = { reference_type:"bra"|"shoe"|"shirt"|"pants"|"dress"|"other"; original_size_label:string; sizing_system:string|null; band_size:number|string|null; cup_designation:string|null; shoe_size:number|string|null };

function fail(code:string):never{redirect(`/onboarding?error=${encodeURIComponent(code)}`);}
function text(formData:FormData,name:string){return String(formData.get(name)??"").trim();}
function isCanonicalImperialLength(key:string,value:number){const multiplier=key==="height"?1:4;return Math.abs(value*multiplier-Math.round(value*multiplier))<0.000001;}

export async function saveFitProfile(formData:FormData){
  const unitSystem=text(formData,"unit_system")==="metric"?"metric":"imperial";
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect("/login?next=/onboarding");

  const [{data:profile,error:profileError},{data:fitProfile,error:fitProfileError},{data:typesData,error:typesError},{data:existingSizeReferences,error:sizeReferenceError}]=await Promise.all([
    supabase.from("profiles").select("username").eq("id",userId).maybeSingle(),
    supabase.from("fit_profiles").select("completed_at").eq("user_id",userId).maybeSingle(),
    supabase.from("measurement_types").select("key, dimension").order("sort_order"),
    supabase.from("user_size_references").select("reference_type,original_size_label,sizing_system,band_size,cup_designation,shoe_size").eq("user_id",userId),
  ]);
  if(profileError||fitProfileError||typesError||sizeReferenceError)fail("save_failed");

  const isInitialSetup=!fitProfile?.completed_at;
  const submittedUsername=text(formData,"username");
  const username=isInitialSetup?submittedUsername:(profile?.username??"");
  if(!/^[A-Za-z0-9_]{3,32}$/.test(username))fail("invalid_username");

  const rows:Array<Record<string,unknown>>=[];
  for(const type of (typesData??[]) as MeasurementType[]){
    if(type.key==="overbust")continue;
    const raw=text(formData,`measurement_${type.key}`);
    if(!raw)continue;
    const value=Number(raw);
    if(!Number.isFinite(value)||value<=0)fail("invalid_measurements");
    if(unitSystem==="imperial"&&type.dimension==="length"&&!isCanonicalImperialLength(type.key,value))fail("invalid_measurements");
    rows.push({measurement_type_key:type.key,entered_value:value,entered_unit:type.dimension==="weight"?(unitSystem==="imperial"?"lb":"kg"):(unitSystem==="imperial"?"in":"cm"),source:"manual",method:type.dimension==="weight"?"scale":"tape"});
  }
  if(!rows.length)fail("invalid_measurements");

  const sizeReferences=((existingSizeReferences??[]) as ExistingSizeReference[]).map((row)=>({reference_type:row.reference_type,original_size_label:row.original_size_label,sizing_system:row.sizing_system,band_size:row.band_size,cup_designation:row.cup_designation,shoe_size:row.shoe_size}));
  const {error}=await supabase.rpc("save_fit_profile",{p_username:username,p_unit_system:unitSystem,p_measurements:rows,p_size_references:sizeReferences});
  if(error){if(error.code==="23505")fail("username_taken");if(error.code==="22023")fail("invalid_measurements");fail("save_failed");}
  redirect("/people?profile=saved");
}
