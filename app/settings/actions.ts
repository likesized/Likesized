"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeProfileLocation } from "@/lib/profile-location";
import { createClient } from "@/lib/supabase/server";

const PROFILE_PHOTO_MAX_BYTES = 400 * 1024;
type FitCommunity = "men"|"women"|"both";

function text(formData:FormData,name:string){return String(formData.get(name)??"").trim();}
function fail(code:string):never{redirect(`/settings?error=${encodeURIComponent(code)}`);}
function fitCommunity(value:string):FitCommunity|null{return value==="men"||value==="women"||value==="both"?value:null;}
async function authenticatedSettingsClient(){const supabase=await createClient();const {data:claimsData,error}=await supabase.auth.getClaims();const userId=claimsData?.claims?.sub;if(error||!userId)redirect("/login?next=/settings");return{supabase,userId};}
function revalidateProfileSurfaces(){revalidatePath("/settings");revalidatePath("/people","layout");revalidatePath("/search");revalidatePath("/following");revalidatePath("/circle");revalidatePath("/explore");revalidatePath("/closet");revalidatePath("/outfits","layout");}

export async function saveUnifiedProfileSettings(formData:FormData){
  const displayName=text(formData,"display_name");
  const bio=text(formData,"bio");
  const location=normalizeProfileLocation(text(formData,"city"),text(formData,"state_region"));
  const community=fitCommunity(text(formData,"fit_community"));
  const removePhoto=text(formData,"remove_profile_photo")==="1";
  const photoEntry=formData.get("profile_photo");
  const photo=photoEntry instanceof File&&photoEntry.size>0?photoEntry:null;

  if(displayName.length>80||bio.length>300)fail("invalid_profile");
  if(!location)fail("invalid_location");
  if(!community)fail("invalid_fit_community");
  if(photo&&(photo.type!=="image/webp"||photo.size>PROFILE_PHOTO_MAX_BYTES))fail("invalid_profile_photo");

  const {supabase,userId}=await authenticatedSettingsClient();
  const {data:profile,error:profileError}=await supabase.from("profiles").select("avatar_url").eq("id",userId).maybeSingle();
  if(profileError)fail("profile_save_failed");
  const oldPath=typeof profile?.avatar_url==="string"?profile.avatar_url:null;
  let newPath:string|null=null;

  if(photo){
    newPath=`${userId}/${randomUUID()}.webp`;
    const {error:uploadError}=await supabase.storage.from("profile-photos").upload(newPath,await photo.arrayBuffer(),{contentType:"image/webp",upsert:false});
    if(uploadError)fail("invalid_profile_photo");
  }

  const avatarUrl=newPath??(removePhoto?null:oldPath);
  const now=new Date().toISOString();
  const [profileResult,communityResult,locationResult]=await Promise.all([
    supabase.from("profiles").update({display_name:displayName||null,bio:bio||null,avatar_url:avatarUrl,updated_at:now}).eq("id",userId),
    supabase.from("fit_profiles").update({fit_community:community,updated_at:now}).eq("user_id",userId),
    supabase.from("profile_locations").upsert({user_id:userId,...location,updated_at:now},{onConflict:"user_id"}),
  ]);

  if(profileResult.error||communityResult.error||locationResult.error){
    if(newPath&&profileResult.error)await supabase.storage.from("profile-photos").remove([newPath]);
    fail("profile_save_failed");
  }

  if(oldPath&&oldPath!==avatarUrl&&oldPath.startsWith(`${userId}/`))await supabase.storage.from("profile-photos").remove([oldPath]);
  revalidateProfileSurfaces();
  redirect("/settings?profile=saved");
}

export async function saveFollowingNotificationSettings(formData:FormData){
  const enabled=text(formData,"enabled")==="true";
  const {supabase}=await authenticatedSettingsClient();
  // Legacy RPC identifier is preserved during recovery; the behavior is Following activity notifications.
  const {error}=await supabase.rpc("set_fit_twin_activity_notifications",{p_enabled:enabled});
  if(error)fail("notification_save_failed");
  revalidatePath("/settings");revalidatePath("/notifications");revalidatePath("/following");revalidatePath("/");
  redirect(`/settings?notifications=${enabled?"on":"off"}`);
}
