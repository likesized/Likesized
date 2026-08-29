import { QUICK_VIEW_STRONG_MATCH_THRESHOLD } from "@/lib/quick-fit-evidence";
import { createClient } from "@/lib/supabase/server";

async function context(slug:string,variation:string){
  const supabase=await createClient();
  const {data:claims,error:claimsError}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(claimsError||!userId)return{error:Response.json({error:"Authentication required."},{status:401})};
  const {data:product,error}=await supabase.from("products").select("id").eq("slug",slug).maybeSingle();
  if(error||!product)return{error:Response.json({error:"Garment not found."},{status:404})};
  return{supabase,userId,productId:product.id as string,variation};
}

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const variation=new URL(request.url).searchParams.get("variation")?.trim()??"";
  const resolved=await context(slug,variation);
  if("error" in resolved)return resolved.error;
  const {supabase,userId,productId}=resolved;
  const {data,error}=await supabase.from("product_evidence_notifications").select("active").eq("user_id",userId).eq("product_id",productId).eq("objective_variant_key",variation).eq("active",true).maybeSingle();
  if(error)return Response.json({error:"Could not load notification status."},{status:500});
  return Response.json({watching:Boolean(data?.active)});
}

export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const body=await request.json().catch(()=>null) as {variationKey?:string|null}|null;
  const variation=body?.variationKey?.trim()??"";
  const resolved=await context(slug,variation);
  if("error" in resolved)return resolved.error;
  const {supabase,userId,productId}=resolved;
  const {error}=await supabase.from("product_evidence_notifications").upsert({user_id:userId,product_id:productId,objective_variant_key:variation,minimum_match_score:QUICK_VIEW_STRONG_MATCH_THRESHOLD,requested_at:new Date().toISOString(),last_notified_at:null,read_at:null,active:true,matched_fit_report_id:null},{onConflict:"user_id,product_id,objective_variant_key"});
  if(error)return Response.json({error:"Could not save notification request."},{status:500});
  return Response.json({watching:true});
}
