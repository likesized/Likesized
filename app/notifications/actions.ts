"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function authenticatedClient(){
  const supabase=await createClient();
  const {data:claimsData,error}=await supabase.auth.getClaims();
  if(error||!claimsData?.claims?.sub)redirect("/login?next=/notifications");
  return supabase;
}

export async function markAllFitTwinNotificationsRead(){
  const supabase=await authenticatedClient();
  const {error}=await supabase.rpc("mark_fit_twin_notifications_read",{p_notification_id:null});
  if(error)redirect("/notifications?error=read_failed");
  revalidatePath("/notifications");
  revalidatePath("/");
  redirect("/notifications?read=all");
}

export async function markFitTwinNotificationRead(formData:FormData){
  const notificationId=String(formData.get("notification_id")??"").trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(notificationId))redirect("/notifications");
  const supabase=await authenticatedClient();
  const {error}=await supabase.rpc("mark_fit_twin_notifications_read",{p_notification_id:notificationId});
  if(error)redirect("/notifications?error=read_failed");
  revalidatePath("/notifications");
  revalidatePath("/");
  redirect("/notifications");
}
