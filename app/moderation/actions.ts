"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TARGETS = new Set(["outfit_post", "fit_reference_photo"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/moderation");
  const { data: isAdmin, error } = await supabase.rpc("is_current_user_admin");
  if (error || !isAdmin) redirect("/");
  return { supabase, userId };
}

export async function reportContent(formData: FormData) {
  const supabase = await createClient();
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const details = String(formData.get("details") ?? "").trim().slice(0, 500);
  const returnTo = String(formData.get("return_to") ?? "/explore");
  if (!TARGETS.has(targetType) || !UUID.test(targetId)) throw new Error("Invalid report target.");
  const { error } = await supabase.rpc("report_content", { p_target_type: targetType, p_target_id: targetId, p_reason: reason, p_details: details || null });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation");
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}reported=1` : "/explore?reported=1");
}

export async function resolveReport(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const reportId = String(formData.get("report_id") ?? "");
  const action = String(formData.get("moderation_action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(reportId) || !new Set(["dismiss_report", "remove_content"]).has(action) || !reason) throw new Error("A valid action and moderation note are required.");
  const { data: report, error: reportError } = await supabase.from("content_reports").select("id,target_type,target_id,reported_user_id,status").eq("id", reportId).single();
  if (reportError || !report || report.status !== "open") throw new Error("This report is no longer open.");
  if (action === "remove_content") {
    if (report.target_type === "outfit_post") {
      const { data: post, error } = await supabase.from("outfit_posts").select("photo_url").eq("id", report.target_id).single();
      if (error || !post) throw new Error("Outfit post not found.");
      const paths = [post.photo_url, post.photo_url.replace(/\/display\.webp$/, "/feed.webp")];
      const { error: storageError } = await supabase.storage.from("outfit-photos").remove([...new Set(paths)]);
      if (storageError) throw new Error("Could not remove outfit photo files.");
      const { error: deleteError } = await supabase.from("outfit_posts").delete().eq("id", report.target_id);
      if (deleteError) throw new Error("Could not remove outfit post.");
    } else {
      const { data: photo, error } = await supabase.from("fit_reference_photos").select("storage_path").eq("id", report.target_id).single();
      if (error || !photo) throw new Error("Fit Report photo not found.");
      const { error: storageError } = await supabase.storage.from("fit-reference-photos").remove([photo.storage_path]);
      if (storageError) throw new Error("Could not remove Fit Report photo file.");
      const { error: deleteError } = await supabase.from("fit_reference_photos").delete().eq("id", report.target_id);
      if (deleteError) throw new Error("Could not remove Fit Report photo.");
    }
  }
  const status = action === "remove_content" ? "content_removed" : "dismissed";
  let reportUpdate = supabase.from("content_reports").update({ status, resolved_at: new Date().toISOString(), resolved_by: userId });
  reportUpdate = action === "remove_content"
    ? reportUpdate.eq("target_type", report.target_type).eq("target_id", report.target_id).eq("status", "open")
    : reportUpdate.eq("id", reportId);
  const { error: updateError } = await reportUpdate;
  if (updateError) throw new Error("Could not close the report.");
  const { error: auditError } = await supabase.from("moderation_actions").insert({ report_id: reportId, admin_user_id: userId, action, target_type: report.target_type, target_id: report.target_id, reported_user_id: report.reported_user_id, reason });
  if (auditError) throw new Error("Could not record the moderation audit.");
  revalidatePath("/moderation"); revalidatePath("/explore"); revalidatePath("/circle");
}

export async function lockCatalogField(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const fieldKind = String(formData.get("field_kind") ?? "");
  const fieldKey = String(formData.get("field_key") ?? "");
  const lockedValue = String(formData.get("locked_value") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(productId) || !new Set(["garment_type", "market_segment", "attribute", "description"]).has(fieldKind) || !fieldKey || !lockedValue || !reason) throw new Error("Complete every catalog decision field.");
  const { error } = await supabase.rpc("admin_lock_product_field", { p_product_id: productId, p_field_kind: fieldKind, p_field_key: fieldKey, p_locked_value: lockedValue, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}

export async function mapCatalogCandidate(formData: FormData) {
  const { supabase } = await requireAdmin();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(candidateId) || !UUID.test(productId) || !reason) throw new Error("Choose a canonical Product and record the mapping reason.");
  const { error } = await supabase.rpc("admin_map_catalog_candidate", { p_candidate_id: candidateId, p_product_id: productId, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/closet"); revalidatePath("/explore");
}

export async function createProductFromCandidate(formData: FormData) {
  const { supabase } = await requireAdmin();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const canonicalName = String(formData.get("canonical_name") ?? "").trim().slice(0, 180);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(candidateId) || !canonicalName || !reason) throw new Error("Canonical Product name and review reason are required.");
  const { error } = await supabase.rpc("admin_create_product_from_candidate", { p_candidate_id: candidateId, p_canonical_name: canonicalName, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/closet"); revalidatePath("/explore");
}

export async function setCandidateStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const candidateId = String(formData.get("candidate_id") ?? "");
  const status = String(formData.get("candidate_status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(candidateId) || !new Set(["pending", "needs_enrichment", "needs_review"]).has(status) || !reason) throw new Error("Choose a valid catalog status and reason.");
  const { error } = await supabase.rpc("admin_set_catalog_candidate_status", { p_candidate_id: candidateId, p_status: status, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation");
}

export async function dismissCatalogFlag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const flagId = String(formData.get("flag_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(flagId) || !reason) throw new Error("A valid catalog flag and dismissal reason are required.");
  const { error } = await supabase.rpc("admin_dismiss_catalog_review_flag", { p_flag_id: flagId, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}

export async function addProductAlias(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = String(formData.get("product_id") ?? "");
  const alias = String(formData.get("alias") ?? "").trim().slice(0, 180);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(productId) || !alias || !reason) throw new Error("Choose a Product and provide the reviewed alias and reason.");
  const { error } = await supabase.rpc("admin_add_product_alias", { p_product_id: productId, p_alias: alias, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}

export async function addBrandAlias(formData: FormData) {
  const { supabase } = await requireAdmin();
  const brandId = String(formData.get("brand_id") ?? "");
  const alias = String(formData.get("alias") ?? "").trim().slice(0, 120);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(brandId) || !alias || !reason) throw new Error("Choose a Brand and provide the reviewed alias and reason.");
  const { error } = await supabase.rpc("admin_add_brand_alias", { p_brand_id: brandId, p_alias: alias, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}

export async function removePendingProductPhoto(formData: FormData) {
  const { supabase } = await requireAdmin();
  const submissionId = String(formData.get("submission_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(submissionId) || !reason) throw new Error("A valid pending Product Photo and moderation reason are required.");
  const { data: submission, error: lookupError } = await supabase
    .from("garment_submissions")
    .select("id,product_photo_storage_path")
    .eq("id", submissionId)
    .single();
  if (lookupError || !submission?.product_photo_storage_path) throw new Error("Pending Product Photo not found.");
  const { error: storageError } = await supabase.storage.from("catalog-submission-photos").remove([submission.product_photo_storage_path]);
  if (storageError) throw new Error("Could not remove pending Product Photo file.");
  const { error } = await supabase.rpc("admin_clear_pending_product_photo", { p_submission_id: submissionId, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/closet");
}

export async function removeCanonicalProductPhoto(formData: FormData) {
  const { supabase } = await requireAdmin();
  const photoId = String(formData.get("photo_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!UUID.test(photoId) || !reason) throw new Error("A valid canonical Product Photo and moderation reason are required.");
  const { data: photo, error: lookupError } = await supabase
    .from("product_photo_evidence")
    .select("id,storage_path")
    .eq("id", photoId)
    .single();
  if (lookupError || !photo?.storage_path) throw new Error("Canonical Product Photo not found.");
  const { error: storageError } = await supabase.storage.from("product-photos").remove([photo.storage_path]);
  if (storageError) throw new Error("Could not remove canonical Product Photo file.");
  const { error } = await supabase.rpc("admin_remove_product_photo_evidence", { p_photo_id: photoId, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}
