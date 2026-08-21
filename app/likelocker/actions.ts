"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SAFE_RETURN = /^\/(?:explore|likelocker)(?:\?[^\s]*)?$/;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function returnTo(formData: FormData) {
  const candidate = value(formData, "return_to");
  return SAFE_RETURN.test(candidate) ? candidate : "/likelocker";
}

async function viewer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { supabase, userId };
}

async function change(table: "product_likes" | "wish_locker_items", add: boolean, formData: FormData) {
  const productId = value(formData, "product_id");
  const destination = returnTo(formData);
  if (!productId) redirect(destination);
  const { supabase, userId } = await viewer();
  const operation = add
    ? supabase.from(table).upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" })
    : supabase.from(table).delete().eq("user_id", userId).eq("product_id", productId);
  const { error } = await operation;
  if (error) throw new Error("Could not update LikeLocker.");
  revalidatePath("/explore");
  revalidatePath("/likelocker");
  redirect(destination);
}

export async function likeProduct(formData: FormData) { await change("product_likes", true, formData); }
export async function unlikeProduct(formData: FormData) { await change("product_likes", false, formData); }
export async function addToWishLocker(formData: FormData) { await change("wish_locker_items", true, formData); }
export async function removeFromWishLocker(formData: FormData) { await change("wish_locker_items", false, formData); }
