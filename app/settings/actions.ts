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
function validProfilePhoto(formData:FormData){const entry=formData.get("profile_photo");return entry instanceof File&&entry.size>0&&entry.type==="image/webp"&&entry.size<=PROFILE_PHOTO_MAX_BYTES?entry:null;}
function revalidateProfileSurfaces(){revalidatePath("/settings");revalidatePath("/people","layout");revalidatePath("/search");revalidatePath("/following");revalidatePath("/circle");revalidatePath("/explore");revalidatePath("/closet");revalidatePath("/outfits","layout");}

export async function saveUsernameSettings(formData:FormData){
  if(text(formData,"confirm_username_change")!=="1")fail("username_locked");
  const username=text(formData,"username");
  if(!/^[A-Za-z0-9_]{3,32}$/.test(username))fail("invalid_username");
  const {supabase,userId}=await authenticatedSettingsClient();
  const {error}=await supabase.from("profiles").update({username,updated_at:new Date().toISOString()}).eq("id",userId);
  if(error){if(error.code==="23505")fail("username_taken");if(error.code==="23514")fail("invalid_username");fail("username_save_failed");}
  revalidateProfileSurfaces();
  redirect("/settings?username=saved");
}

export async function saveProfileSettings(formData:FormData){
  const displayName=text(formData,"display_name");const bio=text(formData,"bio");
  if(displayName.length>80||bio.length>300)fail("invalid_profile");
  const {supabase,userId}=await authenticatedSettingsClient();
  const {error}=await supabase.from("profiles").update({display_name:displayName||null,bio:bio||null,updated_at:new Date().toISOString()}).eq("id",userId);
  if(error){if(error.code==="23514")fail("invalid_profile");fail("save_failed");}
  revalidateProfileSurfaces();redirect("/settings?saved=1");
}

export async function saveProfileLocationSettings(formData:FormData){
  const location=normalizeProfileLocation(text(formData,"city"),text(formData,"state_region"));
  if(!location)fail("invalid_location");
  const {supabase,userId}=await authenticatedSettingsClient();
  const {error}=await supabase.from("profile_locations").upsert({user_id:userId,...location,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error)fail("location_save_failed");
  revalidatePath("/settings");
  redirect("/settings?location=saved");
}

export async function saveFitCommunitySettings(formData:FormData){
  const community=fitCommunity(text(formData,"fit_community"));
  if(!community)fail("invalid_fit_community");
  const {supabase,userId}=await authenticatedSettingsClient();
  const {error}=await supabase.from("fit_profiles").update({fit_community:community,updated_at:new Date().toISOString()}).eq("user_id",userId);
  if(error)fail("fit_community_save_failed");
  revalidateProfileSurfaces();
  redirect("/settings?community=saved");
}

export async function saveProfilePhoto(formData:FormData){
  const photo=validProfilePhoto(formData);if(!photo)fail("invalid_profile_photo");
  const {supabase,userId}=await authenticatedSettingsClient();
  const {data:profile,error:profileError}=await supabase.from("profiles").select("avatar_url").eq("id",userId).maybeSingle();
  if(profileError)fail("profile_photo_save_failed");
  const oldPath=typeof profile?.avatar_url==="string"?profile.avatar_url:null;
  const newPath=`${userId}/${randomUUID()}.webp`;
  const {error:uploadError}=await supabase.storage.from("profile-photos").upload(newPath,await photo.arrayBuffer(),{contentType:"image/webp",upsert:false});
  if(uploadError)fail("profile_photo_save_failed");
  const {error:updateError}=await supabase.from("profiles").update({avatar_url:newPath,updated_at:new Date().toISOString()}).eq("id",userId);
  if(updateError){await supabase.storage.from("profile-photos").remove([newPath]);fail("profile_photo_save_failed");}
  if(oldPath?.startsWith(`${userId}/`))await supabase.storage.from("profile-photos").remove([oldPath]);
  revalidateProfileSurfaces();redirect("/settings?photo=saved");
}

export async function removeProfilePhoto(){
  const {supabase,userId}=await authenticatedSettingsClient();
  const {data:profile,error:profileError}=await supabase.from("profiles").select("avatar_url").eq("id",userId).maybeSingle();
  if(profileError)fail("profile_photo_save_failed");
  const oldPath=typeof profile?.avatar_url==="string"?profile.avatar_url:null;
  const {error:updateError}=await supabase.from("profiles").update({avatar_url:null,updated_at:new Date().toISOString()}).eq("id",userId);
  if(updateError)fail("profile_photo_save_failed");
  if(oldPath?.startsWith(`${userId}/`))await supabase.storage.from("profile-photos").remove([oldPath]);
  revalidateProfileSurfaces();redirect("/settings?photo=removed");
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
