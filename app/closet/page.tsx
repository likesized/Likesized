import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ClosetRow = { id: string; variant_id: string | null; size_label: string; wears_count: number; product: unknown; submission: unknown };
type ProductView = { id: string; name: string; slug: string; category: string; garment_type_key: string | null; brand: unknown };
type BrandView = { name: string };
type PendingView = { brand_text: string; model_text: string; garment_type_key: string };
type FitReport = { closet_item_id: string; fit: string; would_buy_again: boolean | null; created_at: string };
type FitPhoto = { closet_item_id: string; storage_path: string; photo_role: "front" | "back" };
type UnconfirmedStatus = { closet_item_id: string; candidate_id: string; candidate_status: string; retailer_url: string | null; has_product_photo: boolean; has_label_photo: boolean };

const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
const CATEGORY_LABELS: Record<string, string> = { tops: "Tops", bottoms: "Bottoms", dresses: "Dresses", outerwear: "Outerwear", shoes: "Shoes", swimwear: "Swimwear", intimates: "Intimates", sleepwear_lingerie: "Sleepwear & Lingerie", other: "Other" };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function ClosetPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/closet");

  const params = await searchParams;
  const added = first(params.added) === "1";
  const deleted = first(params.deleted) === "1";
  const evidenceAdded = first(params.evidence_added) === "1";

  const [{ data, error }, { data: unconfirmedData, error: unconfirmedError }] = await Promise.all([
    supabase.from("closet_items").select("id,variant_id,size_label,wears_count,product:products(id,name,slug,category,garment_type_key,brand:brands(name)),submission:garment_submissions(brand_text,model_text,garment_type_key)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.rpc("get_own_unconfirmed_submission_status"),
  ]);
  if (error || unconfirmedError) throw new Error("Could not load Closet.");

  const items = (data ?? []) as ClosetRow[];
  const followupByItem = new Map(((unconfirmedData ?? []) as UnconfirmedStatus[]).filter((row) => row.candidate_status === "needs_more_evidence").map((row) => [row.closet_item_id, row]));
  const ids = items.map((item) => item.id);
  let reports: FitReport[] = [];
  let photos: FitPhoto[] = [];
  if (ids.length) {
    const [{ data: reportData, error: reportError }, { data: photoData, error: photoError }] = await Promise.all([
      supabase.from("fit_reports").select("closet_item_id,fit,would_buy_again,created_at").in("closet_item_id", ids).order("created_at", { ascending: false }),
      supabase.from("fit_reference_photos").select("closet_item_id,storage_path,photo_role").in("closet_item_id", ids),
    ]);
    if (reportError || photoError) throw new Error("Could not load Closet evidence.");
    reports = (reportData ?? []) as FitReport[];
    photos = (photoData ?? []) as FitPhoto[];
  }

  const latestReportByItem = new Map<string, FitReport>();
  for (const report of reports) if (!latestReportByItem.has(report.closet_item_id)) latestReportByItem.set(report.closet_item_id, report);
  const photoByItem = new Map<string, string>();
  for (const row of [...photos].sort((a, b) => Number(a.photo_role !== "front") - Number(b.photo_role !== "front"))) if (!photoByItem.has(row.closet_item_id)) photoByItem.set(row.closet_item_id, row.storage_path);
  const signedPhotos = new Map<string, string>();
  await Promise.all(items.map(async (item) => {
    const path = photoByItem.get(item.id);
    if (!path) return;
    const { data: signed } = await supabase.storage.from("fit-reference-photos").createSignedUrl(path, 60 * 30);
    if (signed?.signedUrl) signedPhotos.set(item.id, signed.signedUrl);
  }));

  const garmentCount = items.length;
  const strength = Math.min(100, garmentCount * 10);
  const remaining = Math.max(0, 10 - garmentCount);

  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET</span><h1>Teach LikeSized what fits you.</h1></div><Link className="primaryButton" href="/closet/add">+ Add garment</Link></div>
    {added ? <div className="authMessage">Garment added to your Closet.</div> : null}
    {deleted ? <div className="authMessage">Garment and its fit history removed.</div> : null}
    {evidenceAdded ? <div className="authMessage">Thanks — your added item information was sent back for review.</div> : null}

    <div className="profileStrength"><div><strong>Fit evidence strength</strong><span>{garmentCount} garment{garmentCount === 1 ? "" : "s"} logged{remaining > 0 ? ` · Add ${remaining} more for stronger recommendations` : " · Strong V1 fit history"}</span></div><div className="meter"><span style={{ width: `${strength}%` }} /></div><b>{strength}%</b></div>

    {items.length ? <div className="tableLike">{items.map((item) => {
      const product = one<ProductView>(item.product);
      const brand = one<BrandView>(product?.brand);
      const submission = one<PendingView>(item.submission);
      const report = latestReportByItem.get(item.id);
      const photo = signedPhotos.get(item.id);
      const followup = followupByItem.get(item.id);
      const displayBrand = brand?.name || submission?.brand_text || "Brand";
      const displayName = product?.name || submission?.model_text || "Garment";
      const displayType = product?.garment_type_key || submission?.garment_type_key;
      return <div className="closetRow" key={item.id}>
        {photo ? <img className="garmentPhoto" src={photo} alt="Fit reference" /> : <div className="garmentThumb">{displayBrand.slice(0, 1).toUpperCase()}</div>}
        <div className="closetMain"><span className="muted">{displayBrand}</span><strong>{displayName}</strong><span>{product ? (CATEGORY_LABELS[product.category] || "Other") : (displayType ? displayType.replaceAll("_", " ") : "Garment")}{product && displayType ? ` · ${displayType.replaceAll("_", " ")}` : ""}</span>{followup ? <div><small className="muted"><b>More information needed.</b> We couldn’t confidently identify this item yet. You still have full use of it in your Closet and Styles, but it won’t appear in garment searches for other members until it can be verified.</small><br /><Link className="textLink" href={`/closet/${item.id}/edit?evidence=1#identity-evidence`}>Add More Information →</Link></div> : null}</div>
        <div><span className="muted">SIZE</span><strong>{item.size_label}</strong></div>
        <div><span className="muted">LATEST FIT</span><strong>{FIT_LABELS[report?.fit || ""] || "—"}</strong></div>
        <div className="authActions"><Link className="textLink" href={`/closet/${item.id}/edit`}>Edit →</Link>{product ? <Link className="textLink closetViewLink" href={`/item/${product.slug}${item.variant_id ? `?variant=${encodeURIComponent(item.variant_id)}` : ""}`}>Product →</Link> : null}</div>
      </div>;
    })}</div> : <div className="emptyState"><span className="eyebrow">YOUR CLOSET IS EMPTY</span><h2>Start with something you already know fits.</h2><p>Log the product, original size and fit. If LikeSized does not know the exact Product yet, your garment still saves immediately while the catalog record is reviewed.</p><Link className="primaryButton" href="/closet/add">Add my first garment →</Link></div>}
  </main>;
}
