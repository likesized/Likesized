"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  if (
    path === "/people" ||
    path.startsWith("/people?") ||
    path.startsWith("/people/") ||
    path === "/twins"
  ) {
    return path;
  }
  return "/people";
}

async function authenticatedUserId() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (error || !userId) {
    redirect("/login?next=/people");
  }

  return { supabase, userId };
}

export async function followFitTwin(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const returnTo = safeReturnPath(formData.get("return_to"));
  const { supabase, userId } = await authenticatedUserId();

  if (!targetUserId || targetUserId === userId) {
    redirect(returnTo);
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError || !target?.username) {
    redirect(returnTo);
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: userId,
    followed_id: targetUserId,
  });

  if (error && error.code !== "23505") {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}follow=error`);
  }

  redirect(returnTo);
}

export async function unfollowFitTwin(formData: FormData) {
  const targetUserId = String(formData.get("target_user_id") ?? "");
  const returnTo = safeReturnPath(formData.get("return_to"));
  const { supabase, userId } = await authenticatedUserId();

  if (!targetUserId || targetUserId === userId) {
    redirect(returnTo);
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("followed_id", targetUserId);

  if (error) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}follow=error`);
  }

  redirect(returnTo);
}
