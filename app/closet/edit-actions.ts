"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const FIT_RESULTS=new Set(["too_small","snug","just_right","relaxed","too_big"]);
const GARMENT_CONDITIONS=new Set(["normal","shrunk","stretched_out","altered"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIT_DIMENSION_PREFIX="fit_dimension__";
function text(formData:FormData,name:string){return String(formData.get(name)??"").trim();}
function itemPath(id:string,params?:string){return `/closet/${id}/edit${params?`?${params}`:""}`;}
function fitDimensionRows(formData:FormData){
  const rows=[...formData.entries()].filter(([name,value])=>name.startsWith(FIT_DIMENSION_PREFIX)&&typeof value==="string"&&value.trim()).map(([name,value])=>({dimension_key:name.slice(FIT_DIMENSION_PREFIX.length),response_key:String(value).trim()}));
  if(rows.some((row)=>!row.dimension_key||row.dimension_key.length>80||!row.response_key||row.response_key.length>80)||new Set(rows.map((row)=>row.dimension_key)).size!==rows.length)return null;
  return rows;
}
async function auth(next:string){
  const supabase=await createClient();
  const {data:claimsData,error}=await supabase.auth.getClaims();
  const userId=claimsData?.claims?.sub;
  if(error||!userId)redirect(`/login?next=${encodeURIComponent(next)}`);
  return {supabase,userId};
}

export async function updateClosetSettings(formData:FormData){
  const id=text(formData,"closet_item_id");
  if(!UUID.test(id))redirect("/closet");
  const visibility=text(formData,"visibility")==="shared"?"shared":"private";
  const wearsCount=Number(text(formData,"wears_count")||"0");
  if(!Number.isInteger(wearsCount)||wearsCount<0||wearsCount>100000)redirect(itemPath(id,"error=invalid_settings"));
  const {supabase,userId}=await auth(itemPath(id));
  const {data:item,error:itemError}=await supabase.from("closet_items").select("id").eq("id",id).eq("user_id",userId).maybeSingle();
  if(itemError||!item)redirect("/closet");
  if(visibility==="private"){
    const {data:photo,error:photoError}=await supabase.from("fit_reference_photos").select("id").eq("closet_item_id",id).eq("user_id",userId).maybeSingle();
    if(photoError)redirect(itemPath(id,"error=save_failed"));
    if(photo)redirect(itemPath(id,"error=photo_requires_shared"));
  }
  const {error}=await supabase.from("closet_items").update({visibility,wears_count:wearsCount}).eq("id",id).eq("user_id",userId);
  if(error)redirect(itemPath(id,"error=save_failed"));
  redirect(itemPath(id,"saved=1"));
}

export async function logFitObservation(formData:FormData){
  const id=text(formData,"closet_item_id");
  if(!UUID.test(id))redirect("/closet");
  const fit=text(formData,"fit");
  const garmentCondition=text(formData,"garment_condition")||"normal";
  const notes=text(formData,"fit_notes")||null;
  const buy=text(formData,"would_buy_again");
  const dimensions=fitDimensionRows(formData);
  if(!FIT_RESULTS.has(fit)||!GARMENT_CONDITIONS.has(garmentCondition)||(notes&&notes.length>1000)||dimensions===null)redirect(itemPath(id,"error=invalid_observation"));
  const wouldBuyAgain=buy==="yes"?true:buy==="no"?false:null;
  const {supabase,userId}=await auth(itemPath(id));
  const {data:item,error:itemError}=await supabase.from("closet_items").select("id,product_id,variant_id,size_label,normalized_size_id").eq("id",id).eq("user_id",userId).maybeSingle();
  if(itemError||!item)redirect("/closet");
  const {data:versionId,error:versionError}=await supabase.rpc("commit_fit_profile_version");
  if(versionError||!versionId)redirect(itemPath(id,"error=save_failed"));
  const {data:report,error}=await supabase.from("fit_reports").insert({
    user_id:userId,
    closet_item_id:id,
    product_id:item.product_id,
    variant_id:item.variant_id,
    size_label:item.size_label,
    normalized_size_id:item.normalized_size_id,
    fit_profile_version_id:versionId,
    fit,
    garment_condition:garmentCondition,
    fit_notes:notes,
    would_buy_again:wouldBuyAgain,
  }).select("id").single();
  if(error||!report)redirect(itemPath(id,"error=save_failed"));
  if(dimensions.length){
    const {error:dimensionError}=await supabase.from("fit_report_dimensions").insert(dimensions.map((row)=>({fit_report_id:report.id,...row})));
    if(dimensionError){await supabase.from("fit_reports").delete().eq("id",report.id).eq("user_id",userId);redirect(itemPath(id,"error=invalid_observation"));}
  }
  redirect(itemPath(id,"observed=1"));
}

export async function removeFitPhoto(formData:FormData){
  const id=text(formData,"closet_item_id");
  if(!UUID.test(id))redirect("/closet");
  const {supabase,userId}=await auth(itemPath(id));
  const {data:photo,error}=await supabase.from("fit_reference_photos").select("id,storage_path").eq("closet_item_id",id).eq("user_id",userId).maybeSingle();
  if(error)redirect(itemPath(id,"error=save_failed"));
  if(!photo)redirect(itemPath(id));
  const {error:storageError}=await supabase.storage.from("fit-reference-photos").remove([photo.storage_path]);
  if(storageError)redirect(itemPath(id,"error=save_failed"));
  const {error:deleteError}=await supabase.from("fit_reference_photos").delete().eq("id",photo.id).eq("user_id",userId);
  if(deleteError)redirect(itemPath(id,"error=save_failed"));
  redirect(itemPath(id,"photo_removed=1"));
}

export async function deleteGarment(formData:FormData){
  const id=text(formData,"closet_item_id");
  if(!UUID.test(id))redirect("/closet");
  if(text(formData,"confirm_delete")!=="DELETE")redirect(itemPath(id,"error=confirm_delete"));
  const {supabase,userId}=await auth(itemPath(id));
  const {data:photo}=await supabase.from("fit_reference_photos").select("storage_path").eq("closet_item_id",id).eq("user_id",userId).maybeSingle();
  const {error}=await supabase.from("closet_items").delete().eq("id",id).eq("user_id",userId);
  if(error)redirect(itemPath(id,"error=save_failed"));
  if(photo?.storage_path)await supabase.storage.from("fit-reference-photos").remove([photo.storage_path]);
  redirect("/closet?deleted=1");
}
