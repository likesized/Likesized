"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function fail(code: string): never {
  redirect(`/outfits/new?error=${encodeURIComponent(code)}`);
}

export async function createOutfit(formData: FormData) {
  const caption = String(formData.get("caption") ?? "").trim();
  const selectedIds = [...new Set(
    formData
      .getAll("closet_item_id")
      .map((value) => String(value))
      .filter(Boolean),
  )];
  const photoEntry = formData.get("photo");
  const photo = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  if (caption.length > 500 || selectedIds.length < 1 || selectedIds.length > 6) {
    fail("invalid_fields");
  }

  if (!photo || !PHOTO_TYPES[photo.type] || photo.size > 8 * 1024 * 1024) {
    fail("invalid_photo");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/outfits/new");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.username) {
    redirect("/onboarding");
  }

  const [{ data: ownedItems, error: closetError }, { data: reports, error: reportsError }] =
    await Promise.all([
      supabase
        .from("closet_items")
        .select("id")
        .eq("user_id", userId)
        .in("id", selectedIds),
      supabase
        .from("fit_reports")
        .select("closet_item_id")
        .eq("user_id", userId)
        .in("closet_item_id", selectedIds),
    ]);

  if (
    closetError ||
    reportsError ||
    (ownedItems ?? []).length !== selectedIds.length ||
    (reports ?? []).length !== selectedIds.length
  ) {
    fail("invalid_items");
  }

  const postId = randomUUID();
  const extension = PHOTO_TYPES[photo.type];
  const photoPath = `${userId}/${postId}/outfit.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("outfit-photos")
    .upload(photoPath, await photo.arrayBuffer(), {
      contentType: photo.type,
      upsert: false,
    });

  if (uploadError) {
    fail("save_failed");
  }

  const { error: postError } = await supabase.from("outfit_posts").insert({
    id: postId,
    user_id: userId,
    caption: caption || null,
    photo_url: photoPath,
  });

  if (postError) {
    await supabase.storage.from("outfit-photos").remove([photoPath]);
    fail("save_failed");
  }

  const { error: itemsError } = await supabase.from("outfit_post_items").insert(
    selectedIds.map((closetItemId) => ({
      post_id: postId,
      closet_item_id: closetItemId,
    })),
  );

  if (itemsError) {
    await supabase.from("outfit_posts").delete().eq("id", postId);
    await supabase.storage.from("outfit-photos").remove([photoPath]);
    fail("save_failed");
  }

  redirect("/outfits?posted=1");
}
