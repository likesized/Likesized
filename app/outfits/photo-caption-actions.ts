"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type OutfitPhotoCaptionInput={photoId:string;caption:string};
export type OutfitPhotoCaptionResult={ok:boolean;error?:string};

export async function saveOutfitPhotoCaptions(postId:string,inputs:OutfitPhotoCaptionInput[]):Promise<OutfitPhotoCaptionResult>{
  if(!UUID.test(postId)||!Array.isArray(inputs)||inputs.length>6)return{ok:false,error:"Invalid Outfit photo captions."};
  const normalized=inputs.map((input)=>({photoId:String(input.photoId??""),caption:String(input.caption??"").trim()}));
  if(normalized.some((input)=>!UUID.test(input.photoId)||input.caption.length>200))return{ok:false,error:"Photo captions can be up to 200 characters."};
  const ids=normalized.map((input)=>input.photoId);
  if(new Set(ids).size!==ids.length)return{ok:false,error:"Invalid Outfit photo captions."};

  const supabase=await createClient();
  const {data:claims,error:claimsError}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(claimsError||!userId)return{ok:false,error:"Authentication required."};
  const {data:post,error:postError}=await supabase.from("outfit_posts").select("id").eq("id",postId).eq("user_id",userId).maybeSingle();
  if(postError||!post)return{ok:false,error:"Outfit not found."};
  if(ids.length){
    const {data:photoRows,error:photoError}=await supabase.from("outfit_photos").select("id").eq("post_id",postId).in("id",ids);
    if(photoError||(photoRows??[]).length!==ids.length)return{ok:false,error:"One of those Outfit photos is no longer available."};
    const results=await Promise.all(normalized.map((input)=>supabase.from("outfit_photos").update({caption:input.caption||null}).eq("id",input.photoId).eq("post_id",postId)));
    if(results.some((result)=>result.error))return{ok:false,error:"Could not save the photo captions."};
  }
  revalidatePath(`/outfits/${postId}`);
  return{ok:true};
}
