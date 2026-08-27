"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  if (
    path === "/people" ||
    path.startsWith("/people?") ||
    path.startsWith("/people/") ||
    path === "/following" ||
    path.startsWith("/following?") ||
    path === "/circle" ||
    path.startsWith("/circle?") ||
    path.startsWith("/outfits/") ||
    path === "/notifications"
  ) {
    return path;
  }
  return "/people";
}

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect("/login?next=/people");
  return { supabase, userId };
}

export async function followPerson(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const returnTo = safeReturnPath(formData.get("return_to"));
  const stayOpen = String(formData.get("stay_open") ?? "") === "1";
  const { supabase, userId } = await authenticatedUserId();
  if (!targetUserId || targetUserId === userId) {
    if (stayOpen) throw new Error("Could not follow this person.");
    redirect(returnTo);
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", targetUserId)
    .maybeSingle();
  if (targetError || !target?.username) {
    if (stayOpen) throw new Error("Could not follow this person.");
    redirect(returnTo);
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: userId,
    followed_id: targetUserId,
  });
  if (error && error.code !== "23505") {
    if (stayOpen) throw new Error("Could not follow this person.");
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}follow=error`);
  }

  if (stayOpen) return { ok: true };
  revalidatePath("/following");
  revalidatePath("/circle");
  revalidatePath("/outfits");
  revalidatePath("/notifications");
  redirect(returnTo);
}

export async function unfollowPerson(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const returnTo = safeReturnPath(formData.get("return_to"));
  const stayOpen = String(formData.get("stay_open") ?? "") === "1";
  const { supabase, userId } = await authenticatedUserId();
  if (!targetUserId || targetUserId === userId) {
    if (stayOpen) throw new Error("Could not unfollow this person.");
    redirect(returnTo);
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("followed_id", targetUserId);
  if (error) {
    if (stayOpen) throw new Error("Could not unfollow this person.");
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}follow=error`);
  }

  if (stayOpen) return { ok: true };
  revalidatePath("/following");
  revalidatePath("/circle");
  revalidatePath("/outfits");
  revalidatePath("/notifications");
  redirect(returnTo);
}

export async function setFollowingNotificationSubscription(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";
  const returnTo = safeReturnPath(formData.get("return_to"));
  const { supabase, userId } = await authenticatedUserId();
  if (!targetUserId || targetUserId === userId) redirect(returnTo);

  const { error } = await supabase.rpc("set_following_notification_subscription", {
    p_followed_id: targetUserId,
    p_enabled: enabled,
  });
  if (error) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}notifications=error`);
  }

  revalidatePath("/people");
  revalidatePath(returnTo);
  revalidatePath("/following");
  revalidatePath("/circle");
  revalidatePath("/outfits");
  revalidatePath("/notifications");
  redirect(returnTo);
}

export async function blockPerson(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const { supabase, userId } = await authenticatedUserId();
  if (!targetUserId || targetUserId === userId) redirect("/people");
  const { error } = await supabase.rpc("block_member", { p_blocked_id: targetUserId });
  if (error) throw new Error("Could not block this member.");
  for (const path of ["/people","/circle","/outfits","/explore","/notifications"]) revalidatePath(path);
  redirect("/people?blocked=1");
}
