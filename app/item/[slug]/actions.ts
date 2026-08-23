"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPORT_REASONS=new Set(["inappropriate_content","image_mismatch","incorrect_information","other"]);

export async function reportProductItem(formData:FormData){
  const productId=String(formData.get("product_id")??"");
  const reason=String(formData.get("reason")??"");
  const details=String(formData.get("details")??"").trim().slice(0,500);
  const returnTo=String(formData.get("return_to")??"");
  if(!UUID.test(productId)||!REPORT_REASONS.has(reason))throw new Error("Choose a valid report reason.");

  const supabase=await createClient();
  const {data:claims,error:claimsError}=await supabase.auth.getClaims();
  if(claimsError||!claims?.claims?.sub)redirect(`/login?next=${encodeURIComponent(returnTo.startsWith("/item/")?returnTo:"/search")}`);

  const {error}=await supabase.rpc("report_product_item",{
    p_product_id:productId,
    p_reason:reason,
    p_details:details||null,
  });
  if(error)throw new Error(error.message);

  revalidatePath("/moderation");
  if(returnTo.startsWith("/item/")&&!returnTo.startsWith("//")){
    redirect(`${returnTo}${returnTo.includes("?")?"&":"?"}reported=1`);
  }
  redirect("/search?reported=1");
}
