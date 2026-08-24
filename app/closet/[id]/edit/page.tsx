import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addUnconfirmedIdentityEvidence, deleteGarment, logFitObservation, removeFitPhoto, updateClosetSettings } from "@/app/closet/edit-actions";
import { FitDimensionFields } from "@/app/closet/FitDimensionFields";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Product = { name: string; slug: string; garment_type_key: string | null; market_segment: string; brand: unknown };
type Brand = { name: string };
type Submission = { brand_text: string; model_text: string; garment_type_key: string; retailer_url: string | null };
type Report = { id: string; fit: string; garment_condition: string; fit_notes: string | null; would_buy_again: boolean | null; created_at: string };
type FitPhoto = { id: string; storage_path: string; photo_role: "front" | "back" };
type UnconfirmedStatus = { closet_item_id: string; candidate_id: string; candidate_status: string; retailer_url: string | null; has_product_photo: boolean; has_label_photo: boolean };

const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
const CONDITION_LABELS: Record<string, string> = { normal: "No / Normal wear", shrunk: "Shrunk", stretched_out: "Stretched out", altered: "Altered / Tailored" };
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function dateLabel(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

export default async function EditClosetItemPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect(`/login?next=${encodeURIComponent(`/closet/${id}/edit`)}`);

  const [{ data: item, error: itemError }, { data: reports, error: reportError }, { data: photoRows, error: photoError }, { data: mappings }, { data: definitions }, { data: responses }, { data: unconfirmedData, error: unconfirmedError }] = await Promise.all([
    supabase.from("closet_items").select("id,size_label,wears_count,product:products(name,slug,garment_type_key,market_segment,brand:brands(name)),submission:garment_submissions(brand_text,model_text,garment_type_key,retailer_url)").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("fit_reports").select("id,fit,garment_condition,fit_notes,would_buy_again,created_at").eq("closet_item_id", id).eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("fit_reference_photos").select("id,storage_path,photo_role").eq("closet_item_id", id).eq("user_id", userId).order("photo_role"),
    supabase.from("garment_type_fit_dimensions").select("garment_type_key,dimension_key,sort_order").order("sort_order"),
    supabase.from("fit_dimension_definitions").select("key,label"),
    supabase.from("fit_dimension_responses").select("dimension_key,response_key,label,sort_order").order("sort_order"),
    supabase.rpc("get_own_unconfirmed_submission_status"),
  ]);
  if (itemError || reportError || photoError || unconfirmedError) throw new Error("Could not load garment.");
  if (!item) notFound();

  const product = one<Product>(item.product);
  const brand = one<Brand>(product?.brand);
  const submission = one<Submission>(item.submission);
  const effectiveType = product?.garment_type_key || submission?.garment_type_key || null;
  const displayBrand = brand?.name || submission?.brand_text || "";
  const displayName = product?.name || submission?.model_text || "Garment";
  const labelByKey = new Map((definitions ?? []).map((entry) => [entry.key, entry.label]));
  const dimensions = (mappings ?? []).map((entry) => ({ ...entry, label: labelByKey.get(entry.dimension_key) ?? entry.dimension_key }));
  const history = (reports ?? []) as Report[];
  const photos = (photoRows ?? []) as FitPhoto[];
  const signedPhotos: Array<FitPhoto & { signedUrl: string }> = [];
  await Promise.all(photos.map(async (photo) => {
    const { data } = await supabase.storage.from("fit-reference-photos").createSignedUrl(photo.storage_path, 60 * 30);
    if (data?.signedUrl) signedPhotos.push({ ...photo, signedUrl: data.signedUrl });
  }));
  signedPhotos.sort((a, b) => Number(a.photo_role !== "front") - Number(b.photo_role !== "front"));
  const unconfirmed = ((unconfirmedData ?? []) as UnconfirmedStatus[]).find((row) => row.closet_item_id === id) ?? null;
  const needsMoreEvidence = unconfirmed?.candidate_status === "needs_more_evidence";
  const query = await searchParams;
  const error = first(query.error);
  const message = first(query.saved) === "1" ? "Closet settings saved." : first(query.observed) === "1" ? "New fit observation saved with your current body snapshot." : first(query.photo_removed) === "1" ? "Fit photo removed." : null;
  const errorMessage = error === "invalid_settings" ? "Check the Closet settings." : error === "invalid_observation" ? "Choose a valid physical Fit Result and garment condition." : error === "confirm_delete" ? "Type DELETE exactly to remove this garment and its fit history." : error === "invalid_photo" ? "Use a JPG, PNG, or WebP image up to 8 MB." : error === "invalid_evidence" ? "Check the retail/product webpage link and try again." : error === "evidence_required" ? "Add a new retail/product webpage link, Product Photo, or Product Label / Tag Photo before resubmitting." : error === "save_failed" ? "That change could not be saved." : null;

  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · EDIT</span><h1>{displayBrand ? `${displayBrand} · ` : ""}{displayName}</h1><p>Size {item.size_label}{effectiveType ? ` · ${effectiveType.replaceAll("_", " ")}` : ""}. Product identity and historical try-on records stay locked; new body states create new observations instead of rewriting old ones.</p></div><Link className="secondaryButton" href="/closet">Back to Closet</Link></div>
    {message ? <div className="authMessage">{message}</div> : null}
    {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}

    {needsMoreEvidence ? <section className="section flush" id="identity-evidence">
      <div className="sectionHeading"><div><span className="eyebrow">MORE INFORMATION NEEDED</span><h2>Help us identify this item</h2><p>We weren’t able to confidently identify this item yet. You still have full use of it in your Closet and Styles, but it won’t appear in garment searches for other members until we can verify it.</p></div></div>
      <form className="garmentForm" action={addUnconfirmedIdentityEvidence} encType="multipart/form-data">
        <input type="hidden" name="closet_item_id" value={id} />
        <label>Retail / Product Webpage <span className="muted inlineMuted">optional</span><input name="product_url" type="url" maxLength={1000} defaultValue={unconfirmed?.retailer_url ?? submission?.retailer_url ?? ""} placeholder="https://..." /><span className="fieldHelp">A direct page for this exact item is especially helpful.</span></label>
        <div className="fieldPair">
          <label>Product Photo <span className="muted inlineMuted">optional</span><input name="product_photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp">{unconfirmed?.has_product_photo ? "A Product Photo is already on file. Add a new one only if it gives us better identification evidence." : "Add a clear photo of the item by itself."}</span></label>
          <label>Product Label / Tag Photo <span className="muted inlineMuted">optional</span><input name="product_label_photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp">{unconfirmed?.has_label_photo ? "A Label / Tag Photo is already on file. Add another only if it gives us clearer identifying information." : "Photograph the tag or label that shows the style, article, or identifying information."}</span></label>
        </div>
        <button className="primaryButton" type="submit">Send More Information</button>
      </form>
    </section> : null}

    <section className="section flush"><div className="sectionHeading"><div><span className="eyebrow">CLOSET DETAILS</span><h2>Wear count and Fit Photos</h2></div></div>
      {signedPhotos.length ? <div className="fieldPair">{signedPhotos.map((photo) => <div className="privacyNote" key={photo.id}><img className="garmentPhoto" src={photo.signedUrl} alt={`${photo.photo_role === "front" ? "Front" : "Back"} Fit reference`} /><div><b>{photo.photo_role === "front" ? "Front" : "Back"} Fit/reference photo</b><br />Fit Photos are member-visible fit evidence.<form action={removeFitPhoto}><input type="hidden" name="closet_item_id" value={id} /><input type="hidden" name="photo_id" value={photo.id} /><button className="secondaryButton" type="submit">Remove {photo.photo_role === "front" ? "front" : "back"} photo</button></form></div></div>)}</div> : null}
      <form className="garmentForm" action={updateClosetSettings}><input type="hidden" name="closet_item_id" value={id} /><label>Times worn<input name="wears_count" type="number" min="0" max="100000" step="1" defaultValue={item.wears_count} /></label><button className="primaryButton" type="submit">Save Closet settings</button></form>
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">FIT NOW</span><h2>Log a new fit observation</h2><p>This records how the same garment physically fits your current body. It creates a new immutable Fit Report and leaves every older observation unchanged.</p></div></div>
      <form className="garmentForm" action={logFitObservation}><input type="hidden" name="closet_item_id" value={id} />
        <div className="fieldPair"><label>Overall fit<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select></label><label>Would you buy it again?<select name="would_buy_again" defaultValue="unsure"><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option></select></label></div>
        <label>Has this garment changed from its original fit?<select name="garment_condition" defaultValue="normal"><option value="normal">No / Normal wear</option><option value="shrunk">Shrunk</option><option value="stretched_out">Stretched out</option><option value="altered">Altered / Tailored</option></select><span className="fieldHelp">Choose a changed state only when this specific garment no longer fits the way it did normally.</span></label>
        <div className="privacyNote">Changed garments stay in your Fit History, but LikeSized does not treat their altered fit as normal-product evidence for another copy of the product.</div>
        <FitDimensionFields garmentType={effectiveType} dimensions={dimensions} responses={responses ?? []} />
        <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={2000} rows={4} placeholder="How does it fit now?" /></label>
        <button className="primaryButton" type="submit">Save new fit observation</button>
      </form>
    </section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">LOCKED FIT HISTORY</span><h2>{history.length} observation{history.length === 1 ? "" : "s"}</h2></div></div>{history.length ? <div className="evidenceList">{history.map((report) => <div className="evidence" key={report.id}><div><strong>{dateLabel(report.created_at)}</strong><span>Body snapshot locked at this try-on</span></div><div><span>Fit</span><strong>{FIT_LABELS[report.fit] || report.fit}</strong></div><div><span>Garment condition</span><strong>{CONDITION_LABELS[report.garment_condition] || report.garment_condition}</strong></div><div><span>Buy again</span><strong>{report.would_buy_again === true ? "Yes" : report.would_buy_again === false ? "No" : "—"}</strong></div>{report.fit_notes ? <div><span>Notes</span><strong>{report.fit_notes}</strong></div> : null}</div>)}</div> : null}</section>

    <section className="section"><div className="sectionHeading"><div><span className="eyebrow">REMOVE GARMENT</span><h2>Delete this Closet item and its fit history</h2><p>This removes the Closet item, all of its Fit Reports, fit dimensions, fit-reference-photo metadata, and outfit garment links. Product catalog records remain.</p></div></div><form className="garmentForm" action={deleteGarment}><input type="hidden" name="closet_item_id" value={id} /><label>Type DELETE to confirm<input name="confirm_delete" autoComplete="off" required /></label><button className="secondaryButton" type="submit">Delete garment</button></form></section>
  </main>;
}
