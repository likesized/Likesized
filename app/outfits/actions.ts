"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PHOTO_TYPES: Record<string,string> = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp" };
function fail(code:string):never { redirect(`/outfits/new?error=${encodeURIComponent(code)}`); }
function safeReturnTo(value:FormDataEntryValue|null){const raw=String(value??"");return raw.startsWith("/outfits")&&!raw.startsWith("//")?raw:"/outfits";}

export async function createOutfit(formData:FormData) {
  const caption = String(formData.get("caption") ?? "").trim();
  const selectedIds = [...new Set(formData.getAll("closet_item_id").map((value)=>String(value)).filter(Boolean))];
  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size>0 ? photoEntry : null;
  if (caption.length>500 || selectedIds.length<1 || selectedIds.length>6) fail("invalid_fields");
  if (!photo || !PHOTO_TYPES[photo.type] || photo.size>8*1024*1024) fail("invalid_photo");

  const supabase = await createClient();
  const { data:claimsData,error:claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/outfits/new");
  const { data:profile,error:profileError } = await supabase.from("profiles").select("username").eq("id",userId).maybeSingle();
  if (profileError || !profile?.username) redirect("/onboarding");

  const postId = randomUUID();
  const photoPath = `${userId}/${postId}/outfit.${PHOTO_TYPES[photo.type]}`;
  const { error:uploadError } = await supabase.storage.from("outfit-photos").upload(photoPath,await photo.arrayBuffer(),{contentType:photo.type,upsert:false});
  if (uploadError) fail("save_failed");

  const {error:createError}=await supabase.rpc("create_outfit_post",{
    p_post_id:postId,
    p_caption:caption||null,
    p_photo_url:photoPath,
    p_closet_item_ids:selectedIds,
  });
  if(createError){
    await supabase.storage.from("outfit-photos").remove([photoPath]);
    if(createError.message.includes("Closet")||createError.message.includes("Fit Report"))fail("invalid_items");
    fail("save_failed");
  }

  redirect("/outfits?posted=1");
}

async function outfitReaction(formData:FormData,liked:boolean){
  const postId=String(formData.get("post_id")??"").trim();
  const returnTo=safeReturnTo(formData.get("return_to"));
  if(!/^[0-9a-f-]{36}$/i.test(postId))redirect(returnTo);
  const supabase=await createClient();
  const {data:claimsData,error:claimsError}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(claimsError||!userId)redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if(liked){
    const {error}=await supabase.from("outfit_likes").insert({post_id:postId,user_id:userId});
    if(error&&error.code!=="23505")throw new Error("Could not like outfit.");
  }else{
    const {error}=await supabase.from("outfit_likes").delete().eq("post_id",postId).eq("user_id",userId);
    if(error)throw new Error("Could not remove outfit like.");
  }
  redirect(returnTo);
}

export async function likeOutfit(formData:FormData){return outfitReaction(formData,true);}
export async function unlikeOutfit(formData:FormData){return outfitReaction(formData,false);}
