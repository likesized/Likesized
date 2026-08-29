import type { SupabaseClient } from "@supabase/supabase-js";
import { QUICK_VIEW_STRONG_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";

export async function readProductEvidenceWatch(
  supabase:SupabaseClient,
  userId:string,
  productId:string,
  objectiveVariantKey:string,
){
  const {data,error}=await supabase
    .from("product_evidence_notifications")
    .select("active")
    .eq("user_id",userId)
    .eq("product_id",productId)
    .eq("objective_variant_key",objectiveVariantKey)
    .eq("active",true)
    .maybeSingle();
  return{watching:Boolean(data?.active),error};
}

export async function enableProductEvidenceWatch(
  supabase:SupabaseClient,
  userId:string,
  productId:string,
  objectiveVariantKey:string,
){
  const {error}=await supabase.from("product_evidence_notifications").upsert({
    user_id:userId,
    product_id:productId,
    objective_variant_key:objectiveVariantKey,
    minimum_match_score:QUICK_VIEW_STRONG_MATCH_THRESHOLD,
    requested_at:new Date().toISOString(),
    last_notified_at:null,
    read_at:null,
    active:true,
    matched_fit_report_id:null,
  },{onConflict:"user_id,product_id,objective_variant_key"});
  return{error};
}
