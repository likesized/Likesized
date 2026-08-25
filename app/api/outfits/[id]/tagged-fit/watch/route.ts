import { QUICK_VIEW_STRONG_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id:postId}=await params;if(!UUID.test(postId))return Response.json({error:"Invalid Outfit."},{status:400});
  const body=await request.json().catch(()=>null) as {closetItemId?:string}|null;const closetItemId=body?.closetItemId?.trim()??"";if(!UUID.test(closetItemId))return Response.json({error:"Invalid tagged garment."},{status:400});
  const supabase=await createClient();const {data:claims,error:claimsError}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(claimsError||!userId)return Response.json({error:"Authentication required."},{status:401});
  const {data:link,error:linkError}=await supabase.from("outfit_post_items").select("closet_item_id").eq("post_id",postId).eq("closet_item_id",closetItemId).maybeSingle();if(linkError||!link)return Response.json({error:"Tagged garment not found."},{status:404});
  const {data:report,error:reportError}=await supabase.from("fit_reports").select("product_id,objective_variant_key").eq("closet_item_id",closetItemId).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();if(reportError||!report)return Response.json({error:"Tagged garment has no Fit Report evidence."},{status:404});
  const {error}=await supabase.from("product_evidence_notifications").upsert({user_id:userId,product_id:report.product_id,objective_variant_key:report.objective_variant_key??"",minimum_match_score:QUICK_VIEW_STRONG_MATCH_THRESHOLD,requested_at:new Date().toISOString(),last_notified_at:null,read_at:null},{onConflict:"user_id,product_id,objective_variant_key"});
  if(error)return Response.json({error:"Could not save notification request."},{status:500});
  return Response.json({watching:true});
}
