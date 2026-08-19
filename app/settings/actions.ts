"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function fail(code: string): never {
  redirect(`/settings?error=${encodeURIComponent(code)}`);
}

export async function saveProfileSettings(formData: FormData) {
  const displayName = text(formData, "display_name");
  const bio = text(formData, "bio");

  if (displayName.length > 80 || bio.length > 300) fail("invalid_profile");

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/settings");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    if (error.code === "23514") fail("invalid_profile");
    fail("save_failed");
  }

  revalidatePath("/settings");
  revalidatePath("/people");
  revalidatePath("/search");
  redirect("/settings?saved=1");
}
