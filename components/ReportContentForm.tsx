import { reportContent } from "@/app/moderation/actions";

export function ReportContentForm({ targetType, targetId, returnTo }: { targetType: "outfit_post" | "outfit_comment" | "fit_reference_photo"; targetId: string; returnTo: string }) {
  return <details><summary>Report</summary><form action={reportContent}><input type="hidden" name="target_type" value={targetType}/><input type="hidden" name="target_id" value={targetId}/><input type="hidden" name="return_to" value={returnTo}/><label>Reason<select name="reason" defaultValue="other"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="inappropriate_content">Inappropriate content</option><option value="scam_misleading">Scam / misleading</option><option value="other">Other</option></select></label><label>Details (optional)<textarea name="details" maxLength={500}/></label><button type="submit">Send report</button></form></details>;
}
