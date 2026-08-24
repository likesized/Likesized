"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DISPLAY_MAX_BYTES = 600 * 1024;
const FEED_MAX_BYTES = 220 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;
type SaveMode = "draft" | "publish" | "update";
type ManifestTag = { closetItemId: string; x: number; y: number };
type ManifestPhoto = { key: string; existingId?: string; isMain: boolean; tags: ManifestTag[] };
type ExistingPhoto = { id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; feed_path: string; sort_order: number; is_main: boolean };
type Supabase = Awaited<ReturnType<typeof createClient>>;
export type OutfitSaveResult = { ok: boolean; postId?: string; status?: "draft" | "published"; error?: string };

function text(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
function safeReturnTo(value: FormDataEntryValue | null, fallback = "/outfits") { const raw = String(value ?? ""); return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback; }
function withParam(path: string, key: string, value: string) { return `${path}${path.includes("?") ? "&" : "?"}${encodeURIComponent(key)}=${encodeURIComponent(value)}`; }
function optimizedPhoto(formData: FormData, name: string, maxBytes: number) { const entry = formData.get(name); return entry instanceof File && entry.size > 0 && entry.type === "image/webp" && entry.size <= maxBytes ? entry : null; }

function parseManifest(raw: string): ManifestPhoto[] {
  if (!raw) return [];
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value) || value.length > 6) throw new Error("Outfits allow up to 6 photos.");
  const rows: ManifestPhoto[] = [];
  const keys = new Set<string>();
  const existingIds = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid photo list.");
    const row = item as Record<string, unknown>;
    const key = typeof row.key === "string" ? row.key : "";
    const existingId = typeof row.existingId === "string" && UUID.test(row.existingId) ? row.existingId : undefined;
    const isMain = row.isMain === true;
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(key) || keys.has(key)) throw new Error("Invalid photo list.");
    keys.add(key);
    if (existingId) {
      if (existingIds.has(existingId)) throw new Error("Duplicate photo.");
      existingIds.add(existingId);
    }
    const tagsRaw = Array.isArray(row.tags) ? row.tags : [];
    if (tagsRaw.length > 6) throw new Error("Too many photo tags.");
    const tags: ManifestTag[] = [];
    const garments = new Set<string>();
    for (const tagRaw of tagsRaw) {
      if (!tagRaw || typeof tagRaw !== "object" || Array.isArray(tagRaw)) throw new Error("Invalid photo tag.");
      const tag = tagRaw as Record<string, unknown>;
      const closetItemId = typeof tag.closetItemId === "string" ? tag.closetItemId : "";
      const x = Number(tag.x);
      const y = Number(tag.y);
      if (!UUID.test(closetItemId) || garments.has(closetItemId) || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) throw new Error("Invalid photo tag.");
      garments.add(closetItemId);
      tags.push({ closetItemId, x, y });
    }
    rows.push({ key, existingId, isMain, tags });
  }
  if (rows.length && rows.filter((row) => row.isMain).length !== 1) throw new Error("Choose one cover photo.");
  return rows;
}

async function requireMember() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) throw new Error("Authentication required.");
  const { data: profile, error } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (error || !profile?.username) throw new Error("Complete your member profile first.");
  return { supabase, userId };
}

async function uploadPair(
  supabase: Supabase,
  bucket: "outfit-photos" | "outfit-draft-photos",
  displayPath: string,
  feedPath: string,
  displayPhoto: File,
  feedPhoto: File,
) {
  const [displayBuffer, feedBuffer] = await Promise.all([displayPhoto.arrayBuffer(), feedPhoto.arrayBuffer()]);
  const [displayResult, feedResult] = await Promise.all([
    supabase.storage.from(bucket).upload(displayPath, displayBuffer, { contentType: "image/webp", upsert: false }),
    supabase.storage.from(bucket).upload(feedPath, feedBuffer, { contentType: "image/webp", upsert: false }),
  ]);
  if (displayResult.error || feedResult.error) {
    await supabase.storage.from(bucket).remove([displayPath, feedPath]);
    throw new Error("Could not upload an Outfit photo.");
  }
}

async function moveDraftPhotoToPublic(supabase: Supabase, row: ExistingPhoto) {
  if (row.bucket !== "outfit-draft-photos") return;
  const [{ data: display, error: displayReadError }, { data: feed, error: feedReadError }] = await Promise.all([
    supabase.storage.from("outfit-draft-photos").download(row.display_path),
    supabase.storage.from("outfit-draft-photos").download(row.feed_path),
  ]);
  if (displayReadError || feedReadError || !display || !feed) throw new Error("Could not prepare a draft photo for publishing.");
  const [displayBuffer, feedBuffer] = await Promise.all([display.arrayBuffer(), feed.arrayBuffer()]);
  const [displayUpload, feedUpload] = await Promise.all([
    supabase.storage.from("outfit-photos").upload(row.display_path, displayBuffer, { contentType: "image/webp", upsert: false }),
    supabase.storage.from("outfit-photos").upload(row.feed_path, feedBuffer, { contentType: "image/webp", upsert: false }),
  ]);
  if (displayUpload.error || feedUpload.error) {
    await supabase.storage.from("outfit-photos").remove([row.display_path, row.feed_path]);
    throw new Error("Could not publish an Outfit photo.");
  }
  const { error: rowError } = await supabase.from("outfit_photos").update({ bucket: "outfit-photos" }).eq("id", row.id);
  if (rowError) {
    await supabase.storage.from("outfit-photos").remove([row.display_path, row.feed_path]);
    throw new Error("Could not publish an Outfit photo.");
  }
  await supabase.storage.from("outfit-draft-photos").remove([row.display_path, row.feed_path]);
}

async function cleanupNewFailedPublish(supabase: Supabase, postId: string) {
  const { data: photos } = await supabase.from("outfit_photos").select("bucket,display_path,feed_path").eq("post_id", postId);
  await supabase.from("outfit_posts").delete().eq("id", postId);
  await Promise.all((photos ?? []).map((row) => {
    const bucket = row.bucket === "outfit-photos" ? "outfit-photos" : "outfit-draft-photos";
    return supabase.storage.from(bucket).remove([row.display_path, row.feed_path]);
  }));
}

async function saveOutfit(formData: FormData, mode: SaveMode): Promise<OutfitSaveResult> {
  let cleanup: { supabase: Supabase; postId: string } | null = null;
  try {
    const { supabase, userId } = await requireMember();
    const supplied = text(formData, "post_id");
    const postId = supplied && UUID.test(supplied) ? supplied : randomUUID();
    const headline = text(formData, "headline");
    const story = String(formData.get("story") ?? "").trim();
    const closetItemIds = [...new Set(formData.getAll("closet_item_id").map(String).filter((value) => UUID.test(value)))];
    const occasions = [...new Set(formData.getAll("occasion").map(String).filter(Boolean))];
    const styleTags = formData.getAll("style_tag").map((value) => String(value).trim()).filter(Boolean);
    const commentsEnabled = String(formData.get("comments_enabled") ?? "true") !== "false";
    const manifest = parseManifest(text(formData, "photo_manifest"));

    if (headline.length > 100 || story.length > 5000 || closetItemIds.length > 6 || occasions.length > 2 || styleTags.length > 3) return { ok: false, error: "One of the Outfit limits was exceeded." };
    if (styleTags.some((tag) => tag.replace(/^#+/, "").trim().length > 30)) return { ok: false, error: "Style tags can be up to 30 characters each." };
    if (mode !== "draft" && (!headline || closetItemIds.length < 1 || occasions.length < 1 || manifest.length < 1)) return { ok: false, error: "Add a headline, cover photo, at least one item, and an Occasion before publishing." };

    const { data: existingPost, error: existingPostError } = await supabase.from("outfit_posts").select("id,status,user_id").eq("id", postId).maybeSingle();
    if (existingPostError) throw new Error("Could not load this Outfit.");
    if (existingPost && existingPost.user_id !== userId) throw new Error("Outfit not found.");
    if (mode === "draft" && existingPost?.status === "published") return { ok: false, error: "Published Outfits use Save Changes instead of Save Draft." };
    if (!existingPost && mode !== "draft") cleanup = { supabase, postId };

    const { error: contentError } = await supabase.rpc("save_outfit_post_content", {
      p_post_id: postId,
      p_headline: headline || null,
      p_story: story || null,
      p_closet_item_ids: closetItemIds,
      p_occasions: occasions,
      p_style_tags: styleTags,
      p_comments_enabled: commentsEnabled,
    });
    if (contentError) throw new Error(contentError.message);

    const { data: photoData, error: photoLoadError } = await supabase.from("outfit_photos").select("id,bucket,display_path,feed_path,sort_order,is_main").eq("post_id", postId).order("sort_order");
    if (photoLoadError) throw new Error("Could not load Outfit photos.");
    const existingPhotos = (photoData ?? []) as ExistingPhoto[];
    const existingById = new Map(existingPhotos.map((row) => [row.id, row]));
    for (const item of manifest) if (item.existingId && !existingById.has(item.existingId)) throw new Error("An Outfit photo is no longer available.");

    const kept = new Set(manifest.flatMap((item) => item.existingId ? [item.existingId] : []));
    const removed = existingPhotos.filter((row) => !kept.has(row.id));
    for (const row of removed) {
      const { error } = await supabase.from("outfit_photos").delete().eq("id", row.id).eq("post_id", postId);
      if (error) throw new Error("Could not update the Outfit gallery.");
    }

    const photoIdByKey = new Map<string, string>();
    for (const item of manifest) {
      if (item.existingId) {
        photoIdByKey.set(item.key, item.existingId);
        continue;
      }
      const displayPhoto = optimizedPhoto(formData, `photo_display__${item.key}`, DISPLAY_MAX_BYTES);
      const feedPhoto = optimizedPhoto(formData, `photo_feed__${item.key}`, FEED_MAX_BYTES);
      if (!displayPhoto || !feedPhoto) throw new Error("Every new photo must finish preparing before you save.");
      const photoId = randomUUID();
      const bucket = "outfit-draft-photos" as const;
      const displayPath = `${userId}/${postId}/${photoId}/display.webp`;
      const feedPath = `${userId}/${postId}/${photoId}/feed.webp`;
      await uploadPair(supabase, bucket, displayPath, feedPath, displayPhoto, feedPhoto);
      const { error: registerError } = await supabase.rpc("register_outfit_photo", {
        p_post_id: postId,
        p_photo_id: photoId,
        p_bucket: bucket,
        p_display_path: displayPath,
        p_feed_path: feedPath,
      });
      if (registerError) {
        await supabase.storage.from(bucket).remove([displayPath, feedPath]);
        throw new Error(registerError.message);
      }
      photoIdByKey.set(item.key, photoId);
    }

    if (manifest.length) {
      const orderedIds = manifest.map((item) => photoIdByKey.get(item.key)).filter((value): value is string => Boolean(value));
      const main = manifest.find((item) => item.isMain);
      const mainId = main ? photoIdByKey.get(main.key) : undefined;
      if (orderedIds.length !== manifest.length || !mainId) throw new Error("Could not resolve the Outfit gallery.");
      const { error: orderError } = await supabase.rpc("sync_outfit_photo_order", { p_post_id: postId, p_photo_ids: orderedIds, p_main_photo_id: mainId });
      if (orderError) throw new Error(orderError.message);
      const tagResults = await Promise.all(manifest.map((item) => {
        const photoId = photoIdByKey.get(item.key)!;
        return supabase.rpc("replace_outfit_photo_tags", {
          p_photo_id: photoId,
          p_tags: item.tags.map((tag) => ({ closet_item_id: tag.closetItemId, x: tag.x, y: tag.y })),
        });
      }));
      const tagError = tagResults.find((result) => result.error)?.error;
      if (tagError) throw new Error(tagError.message);
    }

    await Promise.all(removed.map((row) => supabase.storage.from(row.bucket).remove([row.display_path, row.feed_path])));

    if (mode !== "draft") {
      const { data: currentPhotoData, error: currentPhotoError } = await supabase.from("outfit_photos").select("id,bucket,display_path,feed_path,sort_order,is_main").eq("post_id", postId);
      if (currentPhotoError) throw new Error("Could not prepare Outfit photos.");
      await Promise.all(((currentPhotoData ?? []) as ExistingPhoto[]).map((row) => moveDraftPhotoToPublic(supabase, row)));
      const { error: publishError } = await supabase.rpc("publish_outfit_post", { p_post_id: postId });
      if (publishError) throw new Error(publishError.message);
    }

    cleanup = null;
    for (const path of ["/outfits", "/outfits/drafts", `/outfits/${postId}`, "/circle", "/explore"]) revalidatePath(path);
    return { ok: true, postId, status: mode === "draft" ? "draft" : "published" };
  } catch (error) {
    if (cleanup) await cleanupNewFailedPublish(cleanup.supabase, cleanup.postId);
    return { ok: false, error: error instanceof Error ? error.message : "That Outfit could not be saved." };
  }
}

export async function saveOutfitDraft(formData: FormData) { return saveOutfit(formData, "draft"); }
export async function publishOutfit(formData: FormData) { return saveOutfit(formData, "publish"); }
export async function savePublishedOutfit(formData: FormData) { return saveOutfit(formData, "update"); }

async function outfitReaction(formData: FormData, liked: boolean) {
  const postId = text(formData, "post_id");
  const returnTo = safeReturnTo(formData.get("return_to"));
  if (!UUID.test(postId)) redirect(returnTo);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (liked) {
    const { error } = await supabase.from("outfit_likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code !== "23505") throw new Error("Could not like Outfit.");
  } else {
    const { error } = await supabase.from("outfit_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw new Error("Could not remove Outfit like.");
  }
  revalidatePath(`/outfits/${postId}`);
  revalidatePath("/outfits");
  redirect(returnTo);
}

export async function likeOutfit(formData: FormData) { return outfitReaction(formData, true); }
export async function unlikeOutfit(formData: FormData) { return outfitReaction(formData, false); }

export async function addOutfitComment(formData: FormData) {
  const postId = text(formData, "post_id");
  const body = String(formData.get("body") ?? "").trim();
  const returnTo = safeReturnTo(formData.get("return_to"), UUID.test(postId) ? `/outfits/${postId}` : "/outfits");
  if (!UUID.test(postId) || !body || body.length > 500 || LINK_PATTERN.test(body)) redirect(withParam(returnTo, "comment_error", "1"));
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  const { error } = await supabase.from("outfit_comments").insert({ post_id: postId, user_id: userId, body });
  if (error) redirect(withParam(returnTo, "comment_error", "1"));
  revalidatePath(`/outfits/${postId}`);
  redirect(withParam(returnTo, "commented", "1"));
}

export async function deleteOutfitComment(formData: FormData) {
  const commentId = text(formData, "comment_id");
  const postId = text(formData, "post_id");
  const returnTo = safeReturnTo(formData.get("return_to"), UUID.test(postId) ? `/outfits/${postId}` : "/outfits");
  if (!UUID.test(commentId)) redirect(returnTo);
  const supabase = await createClient();
  const { error } = await supabase.from("outfit_comments").delete().eq("id", commentId);
  if (error) throw new Error("Could not delete comment.");
  if (UUID.test(postId)) revalidatePath(`/outfits/${postId}`);
  redirect(returnTo);
}

export async function toggleOutfitComments(formData: FormData) {
  const postId = text(formData, "post_id");
  const enabled = text(formData, "enabled") === "true";
  const returnTo = safeReturnTo(formData.get("return_to"), UUID.test(postId) ? `/outfits/${postId}` : "/outfits");
  if (!UUID.test(postId)) redirect(returnTo);
  const supabase = await createClient();
  const { error } = await supabase.from("outfit_posts").update({ comments_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", postId);
  if (error) throw new Error("Could not update comments.");
  revalidatePath(`/outfits/${postId}`);
  redirect(returnTo);
}

export async function followFromOutfit(formData: FormData) {
  const postId = text(formData, "post_id");
  const returnTo = safeReturnTo(formData.get("return_to"), UUID.test(postId) ? `/outfits/${postId}` : "/outfits");
  if (!UUID.test(postId)) redirect(returnTo);
  const supabase = await createClient();
  const { error } = await supabase.rpc("follow_from_outfit", { p_post_id: postId });
  if (error) throw new Error(error.message);
  revalidatePath(`/outfits/${postId}`);
  revalidatePath("/circle");
  redirect(returnTo);
}

export async function blockMemberFromOutfit(formData: FormData) {
  const memberId = text(formData, "member_id");
  if (!UUID.test(memberId)) redirect("/outfits");
  const supabase = await createClient();
  const { error } = await supabase.rpc("block_member", { p_blocked_id: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/outfits");
  revalidatePath("/circle");
  revalidatePath("/explore");
  redirect("/outfits?blocked=1");
}

export async function unblockMember(formData: FormData) {
  const memberId = text(formData, "member_id");
  const returnTo = safeReturnTo(formData.get("return_to"));
  if (!UUID.test(memberId)) redirect(returnTo);
  const supabase = await createClient();
  const { error } = await supabase.rpc("unblock_member", { p_blocked_id: memberId });
  if (error) throw new Error(error.message);
  revalidatePath("/outfits");
  revalidatePath("/circle");
  revalidatePath("/explore");
  redirect(returnTo);
}

export async function deleteOutfit(formData: FormData) {
  const postId = text(formData, "post_id");
  if (!UUID.test(postId)) redirect("/outfits");
  const supabase = await createClient();
  const { data: photos, error: photoError } = await supabase.from("outfit_photos").select("bucket,display_path,feed_path").eq("post_id", postId);
  if (photoError) throw new Error("Could not load Outfit photos.");
  const { error } = await supabase.from("outfit_posts").delete().eq("id", postId);
  if (error) throw new Error("Could not delete Outfit.");
  await Promise.all((photos ?? []).map((row) => {
    const bucket = row.bucket === "outfit-draft-photos" ? "outfit-draft-photos" : "outfit-photos";
    return supabase.storage.from(bucket).remove([row.display_path, row.feed_path]);
  }));
  revalidatePath("/outfits");
  revalidatePath("/outfits/drafts");
  revalidatePath("/circle");
  revalidatePath("/explore");
  redirect("/outfits?deleted=1");
}
