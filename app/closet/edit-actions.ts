"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const FIT_RESULTS = new Set(["too_small", "snug", "just_right", "relaxed", "too_big"]);
const GARMENT_CONDITIONS = new Set(["normal", "shrunk", "stretched_out", "altered"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIT_DIMENSION_PREFIX = "fit_dimension__";
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "dclid", "mc_cid", "mc_eid", "msclkid"]);
function text(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
function file(formData: FormData, name: string) { const value = formData.get(name); return value instanceof File && value.size > 0 ? value : null; }
function itemPath(id: string, params?: string) { return `/closet/${id}/edit${params ? `?${params}` : ""}`; }
function normalizeProductUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid URL");
  url.protocol = "https:";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}
function fitDimensionRows(formData: FormData) {
  const rows = [...formData.entries()].filter(([name, value]) => name.startsWith(FIT_DIMENSION_PREFIX) && typeof value === "string" && value.trim()).map(([name, value]) => ({ dimension_key: name.slice(FIT_DIMENSION_PREFIX.length), response_key: String(value).trim() }));
  if (rows.some((row) => !row.dimension_key || row.dimension_key.length > 80 || !row.response_key || row.response_key.length > 80) || new Set(rows.map((row) => row.dimension_key)).size !== rows.length) return null;
  return rows;
}
async function auth(next: string) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (error || !userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, userId };
}

export async function updateClosetSettings(formData: FormData) {
  const id = text(formData, "closet_item_id");
  if (!UUID.test(id)) redirect("/closet");
  const wearsCount = Number(text(formData, "wears_count") || "0");
  if (!Number.isInteger(wearsCount) || wearsCount < 0 || wearsCount > 100000) redirect(itemPath(id, "error=invalid_settings"));
  const { supabase, userId } = await auth(itemPath(id));
  const { data: item, error: itemError } = await supabase.from("closet_items").select("id").eq("id", id).eq("user_id", userId).maybeSingle();
  if (itemError || !item) redirect("/closet");
  const { error } = await supabase.from("closet_items").update({ wears_count: wearsCount }).eq("id", id).eq("user_id", userId);
  if (error) redirect(itemPath(id, "error=save_failed"));
  redirect(itemPath(id, "saved=1"));
}

export async function logFitObservation(formData: FormData) {
  const id = text(formData, "closet_item_id");
  if (!UUID.test(id)) redirect("/closet");
  const fit = text(formData, "fit");
  const garmentCondition = text(formData, "garment_condition") || "normal";
  const notes = text(formData, "fit_notes") || null;
  const buy = text(formData, "would_buy_again");
  const dimensions = fitDimensionRows(formData);
  if (!FIT_RESULTS.has(fit) || !GARMENT_CONDITIONS.has(garmentCondition) || (notes && notes.length > 2000) || dimensions === null) redirect(itemPath(id, "error=invalid_observation"));
  const wouldBuyAgain = buy === "yes" ? true : buy === "no" ? false : null;
  const { supabase, userId } = await auth(itemPath(id));
  const [{ data: item, error: itemError }, { data: identitySource, error: identityError }] = await Promise.all([
    supabase.from("closet_items").select("id,product_id,variant_id,size_label,normalized_size_id").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("fit_reports").select("garment_type_key,garment_answers,objective_variant_key").eq("closet_item_id", id).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (itemError || identityError || !item) redirect("/closet");
  const { data: versionId, error: versionError } = await supabase.rpc("commit_fit_profile_version");
  if (versionError || !versionId) redirect(itemPath(id, "error=save_failed"));
  const { data: report, error } = await supabase.from("fit_reports").insert({
    user_id: userId,
    closet_item_id: id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    size_label: item.size_label,
    normalized_size_id: item.normalized_size_id,
    fit_profile_version_id: versionId,
    fit,
    garment_condition: garmentCondition,
    fit_notes: notes,
    would_buy_again: wouldBuyAgain,
    garment_type_key: identitySource?.garment_type_key ?? null,
    garment_answers: identitySource?.garment_answers ?? {},
    objective_variant_key: identitySource?.objective_variant_key ?? null,
  }).select("id").single();
  if (error || !report) redirect(itemPath(id, "error=save_failed"));
  if (dimensions.length) {
    const { error: dimensionError } = await supabase.from("fit_report_dimensions").insert(dimensions.map((row) => ({ fit_report_id: report.id, ...row })));
    if (dimensionError) {
      await supabase.from("fit_reports").delete().eq("id", report.id).eq("user_id", userId);
      redirect(itemPath(id, "error=invalid_observation"));
    }
  }
  redirect(itemPath(id, "observed=1"));
}

export async function removeFitPhoto(formData: FormData) {
  const id = text(formData, "closet_item_id");
  const photoId = text(formData, "photo_id");
  if (!UUID.test(id) || !UUID.test(photoId)) redirect("/closet");
  const { supabase, userId } = await auth(itemPath(id));
  const { data: photo, error } = await supabase.from("fit_reference_photos").select("id,storage_path").eq("id", photoId).eq("closet_item_id", id).eq("user_id", userId).maybeSingle();
  if (error) redirect(itemPath(id, "error=save_failed"));
  if (!photo) redirect(itemPath(id));
  const { error: storageError } = await supabase.storage.from("fit-reference-photos").remove([photo.storage_path]);
  if (storageError) redirect(itemPath(id, "error=save_failed"));
  const { error: deleteError } = await supabase.from("fit_reference_photos").delete().eq("id", photo.id).eq("user_id", userId);
  if (deleteError) redirect(itemPath(id, "error=save_failed"));
  redirect(itemPath(id, "photo_removed=1"));
}

export async function addUnconfirmedIdentityEvidence(formData: FormData) {
  const id = text(formData, "closet_item_id");
  if (!UUID.test(id)) redirect("/closet");
  const retailLink = text(formData, "product_url");
  const productPhoto = file(formData, "product_photo");
  const labelPhoto = file(formData, "product_label_photo");
  for (const candidate of [productPhoto, labelPhoto]) if (candidate && (!PHOTO_TYPES[candidate.type] || candidate.size > 8 * 1024 * 1024)) redirect(itemPath(id, "evidence=1&error=invalid_photo#identity-evidence"));
  let normalizedRetailLink: string | null = null;
  if (retailLink) { try { normalizedRetailLink = normalizeProductUrl(retailLink); } catch { redirect(itemPath(id, "evidence=1&error=invalid_evidence#identity-evidence")); } }

  const { supabase, userId } = await auth(itemPath(id, "evidence=1#identity-evidence"));
  const { data: submission, error: submissionError } = await supabase.from("garment_submissions").select("id,candidate_id,retailer_url,normalized_retailer_url,product_photo_storage_path,product_label_photo_storage_path,identity_uncertain").eq("closet_item_id", id).eq("user_id", userId).maybeSingle();
  if (submissionError || !submission?.identity_uncertain) redirect(itemPath(id, "error=save_failed"));
  const sameRetail = !retailLink || normalizedRetailLink === submission.normalized_retailer_url;
  if (sameRetail && !productPhoto && !labelPhoto) redirect(itemPath(id, "evidence=1&error=evidence_required#identity-evidence"));

  const newPaths: string[] = [];
  let productPath: string | null = null;
  let labelPath: string | null = null;
  try {
    if (productPhoto) {
      productPath = `${userId}/${id}/${randomUUID()}-product.${PHOTO_TYPES[productPhoto.type]}`;
      const { error } = await supabase.storage.from("catalog-submission-photos").upload(productPath, await productPhoto.arrayBuffer(), { contentType: productPhoto.type, upsert: false });
      if (error) throw error;
      newPaths.push(productPath);
    }
    if (labelPhoto) {
      labelPath = `${userId}/${id}/${randomUUID()}-label.${PHOTO_TYPES[labelPhoto.type]}`;
      const { error } = await supabase.storage.from("catalog-submission-photos").upload(labelPath, await labelPhoto.arrayBuffer(), { contentType: labelPhoto.type, upsert: false });
      if (error) throw error;
      newPaths.push(labelPath);
    }
    const { error } = await supabase.rpc("add_unconfirmed_catalog_evidence", {
      p_closet_item_id: id,
      p_retailer_url: retailLink || null,
      p_normalized_retailer_url: normalizedRetailLink,
      p_product_photo_storage_path: productPath,
      p_product_label_photo_storage_path: labelPath,
    });
    if (error) throw error;
    const replaced = [productPhoto ? submission.product_photo_storage_path : null, labelPhoto ? submission.product_label_photo_storage_path : null].filter((path): path is string => Boolean(path));
    if (replaced.length) await supabase.storage.from("catalog-submission-photos").remove(replaced);
  } catch {
    if (newPaths.length) await supabase.storage.from("catalog-submission-photos").remove(newPaths);
    redirect(itemPath(id, "evidence=1&error=save_failed#identity-evidence"));
  }
  redirect("/closet?evidence_added=1");
}

export async function deleteGarment(formData: FormData) {
  const id = text(formData, "closet_item_id");
  if (!UUID.test(id)) redirect("/closet");
  if (text(formData, "confirm_delete") !== "DELETE") redirect(itemPath(id, "error=confirm_delete"));
  const { supabase, userId } = await auth(itemPath(id));
  const { data: photos } = await supabase.from("fit_reference_photos").select("storage_path").eq("closet_item_id", id).eq("user_id", userId);
  const { error } = await supabase.from("closet_items").delete().eq("id", id).eq("user_id", userId);
  if (error) redirect(itemPath(id, "error=save_failed"));
  const paths = (photos ?? []).map((photo) => photo.storage_path).filter(Boolean);
  if (paths.length) await supabase.storage.from("fit-reference-photos").remove(paths);
  redirect("/closet?deleted=1");
}
