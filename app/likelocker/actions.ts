"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SAFE_RETURN = /^\/(?:explore|likelocker)(?:\?[^\s]*)?$|^\/outfits\/[0-9a-f-]{36}(?:\?[^\s]*)?$|^\/item\/[a-z0-9-]+(?:\?[^\s]*)?$/i;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function returnTo(formData: FormData) {
  const candidate = value(formData, "return_to");
  return SAFE_RETURN.test(candidate) && !candidate.startsWith("//") ? candidate : "/likelocker";
}

async function viewer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { supabase, userId };
}

async function change(table: "product_likes" | "wish_locker_items" | "product_evidence_notifications", add: boolean, formData: FormData) {
  const productId = value(formData, "product_id");
  const destination = returnTo(formData);
  const stayOpen = value(formData, "stay_open") === "1";
  if (!productId) {
    if (stayOpen) return;
    redirect(destination);
  }
  const { supabase, userId } = await viewer();
  const operation = add
    ? supabase.from(table).upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" })
    : supabase.from(table).delete().eq("user_id", userId).eq("product_id", productId);
  const { error } = await operation;
  if (error) throw new Error("Could not update LikeLocker.");
  if (stayOpen) return;
  revalidatePath("/explore");
  revalidatePath("/likelocker");
  if (destination.startsWith("/outfits/") || destination.startsWith("/item/")) revalidatePath(destination.split("?")[0]);
  redirect(destination);
}

export async function likeProduct(formData: FormData) { await change("product_likes", true, formData); }
export async function unlikeProduct(formData: FormData) { await change("product_likes", false, formData); }
export async function addToWishLocker(formData: FormData) { await change("wish_locker_items", true, formData); }
export async function removeFromWishLocker(formData: FormData) { await change("wish_locker_items", false, formData); }
export async function requestEvidenceNotification(formData: FormData) { await change("product_evidence_notifications", true, formData); }
export async function cancelEvidenceNotification(formData: FormData) { await change("product_evidence_notifications", false, formData); }
