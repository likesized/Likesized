import { reportContent } from "@/app/moderation/actions";

type Target = "outfit_post" | "outfit_comment" | "fit_reference_photo";

export function ReportContentForm({ targetType, targetId, returnTo }: { targetType: Target; targetId: string; returnTo: string }) {
  const outfitReasons = targetType === "outfit_post" || targetType === "outfit_comment";
  return <details><summary>Report</summary><form action={reportContent}>
    <input type="hidden" name="target_type" value={targetType}/>
    <input type="hidden" name="target_id" value={targetId}/>
    <input type="hidden" name="return_to" value={returnTo}/>
    <label>Reason<select name="reason" defaultValue="other">
      {outfitReasons ? <>
        <option value="spam">Spam</option>
        <option value="harassment">Harassment</option>
        <option value="inappropriate_content">Inappropriate content</option>
        <option value="scam_misleading">Scam / misleading</option>
      </> : <>
        <option value="nudity_or_sexual_content">Nudity or sexual content</option>
        <option value="harassment_or_hate">Harassment or hate</option>
        <option value="violence_or_dangerous_content">Violence or dangerous content</option>
        <option value="spam_or_scam">Spam or scam</option>
        <option value="privacy_violation">Privacy violation</option>
      </>}
      <option value="other">Other</option>
    </select></label>
    <label>Details (optional)<textarea name="details" maxLength={500}/></label>
    <button type="submit">Send report</button>
  </form></details>;
}
