import { enableProductEvidenceWatch, readProductEvidenceWatch } from "@/lib/product-evidence-watch";
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
  const {watching,error}=await readProductEvidenceWatch(resolved.supabase,resolved.userId,resolved.productId,variation);
  if(error)return Response.json({error:"Could not load notification status."},{status:500});
  return Response.json({watching},{headers:{"cache-control":"private, no-store"}});
}

export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const body=await request.json().catch(()=>null) as {variationKey?:string|null}|null;
  const variation=body?.variationKey?.trim()??"";
  const resolved=await context(slug,variation);
  if("error" in resolved)return resolved.error;
  const {error}=await enableProductEvidenceWatch(resolved.supabase,resolved.userId,resolved.productId,variation);
  if(error)return Response.json({error:"Could not save notification request."},{status:500});
  return Response.json({watching:true},{headers:{"cache-control":"private, no-store"}});
}
