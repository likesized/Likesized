import { enableProductEvidenceWatch, readProductEvidenceWatch } from "@/lib/product-evidence-watch";
import { createClient } from "@/lib/supabase/server";

async function resolveContext(slug:string,trackedVariationKey:string){
  const supabase=await createClient();
  const {data:claims,error:claimsError}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(claimsError||!userId)return{error:Response.json({error:"Authentication required."},{status:401})};
  const {data:product,error:productError}=await supabase.from("products").select("id").eq("slug",slug).maybeSingle();
  if(productError||!product)return{error:Response.json({error:"Garment not found."},{status:404})};
  let objectiveVariantKey="";
  if(trackedVariationKey){
    const {data:report}=await supabase.from("fit_reports").select("objective_variant_key").eq("product_id",product.id).eq("tracked_variation_key",trackedVariationKey).not("objective_variant_key","is",null).order("created_at",{ascending:false}).limit(1).maybeSingle();
    objectiveVariantKey=report?.objective_variant_key??"";
  }
  return{supabase,userId,productId:product.id as string,objectiveVariantKey};
}

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const trackedVariationKey=new URL(request.url).searchParams.get("variation")?.trim()??"";const context=await resolveContext(slug,trackedVariationKey);if("error" in context)return context.error;
  const {watching,error}=await readProductEvidenceWatch(context.supabase,context.userId,context.productId,context.objectiveVariantKey);if(error)return Response.json({error:"Could not load notification status."},{status:500});return Response.json({watching},{headers:{"cache-control":"private, no-store"}});
}

export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const body=await request.json().catch(()=>null) as {variationKey?:string|null}|null;const context=await resolveContext(slug,body?.variationKey?.trim()??"");if("error" in context)return context.error;
  const {error}=await enableProductEvidenceWatch(context.supabase,context.userId,context.productId,context.objectiveVariantKey);if(error)return Response.json({error:"Could not save notification request."},{status:500});return Response.json({watching:true},{headers:{"cache-control":"private, no-store"}});
}
