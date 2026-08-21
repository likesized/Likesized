"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TARGETS = new Set(["outfit_post", "fit_reference_photo"]);

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
  if (!TARGETS.has(targetType) || !/^[0-9a-f-]{36}$/i.test(targetId)) throw new Error("Invalid report target.");
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
  if (!/^[0-9a-f-]{36}$/i.test(reportId) || !new Set(["dismiss_report", "remove_content"]).has(action) || !reason) throw new Error("A valid action and moderation note are required.");
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
  const { error: updateError } = await supabase.from("content_reports").update({ status, resolved_at: new Date().toISOString(), resolved_by: userId }).eq("id", reportId);
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
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !new Set(["garment_type", "market_segment", "attribute", "description"]).has(fieldKind) || !fieldKey || !lockedValue || !reason) throw new Error("Complete every catalog decision field.");
  const { error } = await supabase.rpc("admin_lock_product_field", { p_product_id: productId, p_field_kind: fieldKind, p_field_key: fieldKey, p_locked_value: lockedValue, p_reason: reason });
  if (error) throw new Error(error.message);
  revalidatePath("/moderation"); revalidatePath("/explore");
}
