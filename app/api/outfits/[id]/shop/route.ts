import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const url=new URL(request.url); const productId=url.searchParams.get("product_id")??"";
  if(!UUID.test(id)||!UUID.test(productId))return NextResponse.redirect(new URL(`/outfits/${id}`,request.url));
  const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub){const login=new URL("/login",request.url);login.searchParams.set("next",`/outfits/${id}`);return NextResponse.redirect(login);}
  const {data:product}=await supabase.from("products").select("slug,retailer_url").eq("id",productId).maybeSingle();
  if(!product?.slug)return NextResponse.redirect(new URL(`/outfits/${id}`,request.url));
  const {error:trackError}=await supabase.rpc("record_outfit_shop_click",{p_post_id:id,p_product_id:productId});
  if(trackError)return NextResponse.redirect(new URL(`/outfits/${id}`,request.url));
  const listing=await supabase.from("retailer_listings").select("product_url").eq("product_id",productId).limit(1).maybeSingle();
  const target=listing.data?.product_url??product.retailer_url??null;
  if(!target)return NextResponse.redirect(new URL(`/item/${product.slug}`,request.url));
  try{const destination=new URL(target);if(destination.protocol!=="http:"&&destination.protocol!=="https:")throw new Error("bad protocol");return NextResponse.redirect(destination);}
  catch{return NextResponse.redirect(new URL(`/item/${product.slug}`,request.url));}
}
