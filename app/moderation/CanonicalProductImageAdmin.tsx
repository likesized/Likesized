import { createClient } from "@/lib/supabase/server";
import {
  setCanonicalProductImage,
  setFitPhotoCanonicalEligibility,
  unlockCanonicalProductImage,
} from "./actions";
import styles from "./moderation.module.css";

type Brand = { name: string };
type Product = { name: string; image_url?: string | null; brand: unknown };
type Closet = { product_id: string | null; product: unknown };
type CanonicalSelection = {
  id: string;
  product_id: string;
  variation_key: string | null;
  source_kind: string;
  fit_reference_photo_id: string | null;
  product_photo_evidence_id: string | null;
  source_image_url: string | null;
  photo_quality_score: number | null;
  canonical_locked: boolean;
  lock_reason: string | null;
  selected_at: string;
  product: unknown;
};
type FitPhotoCandidate = {
  id: string;
  closet_item_id: string;
  storage_path: string;
  photo_role: string;
  photo_quality_score: number;
  canonical_eligible: boolean;
  canonical_ineligible_reason: string | null;
  quality_source: string;
  resolution_score: number;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  closet: unknown;
};
type ProductPhotoCandidate = {
  id: string;
  product_id: string;
  public_url: string;
  source_status: string;
  created_at: string;
  product: unknown;
};
type FitReportVariation = { closet_item_id: string; tracked_variation_key: string | null; created_at: string };
type ImageAudit = { id: string; product_id: string; variation_key: string | null; action: string; source_kind: string | null; reason: string; created_at: string };

function one<T>(value: unknown): T | null {
  return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null);
}
function productLabel(value: unknown) {
  const product = one<Product>(value);
  const brand = product ? one<Brand>(product.brand) : null;
  return `${brand?.name || "Brand"} · ${product?.name || "Product"}`;
}
function sourceLabel(value: string) {
  if (value === "fit_reference_photo") return "Fit Report photo";
  if (value === "product_photo_evidence") return "Product Photo evidence";
  if (value === "official_product_image") return "Official / imported image";
  return value.replaceAll("_", " ");
}
function variationLabel(value: string | null) {
  return value ? `Exact tracked variation · ${value.slice(0, 10)}…` : "Product-level image";
}

export default async function CanonicalProductImageAdmin() {
  const supabase = await createClient();
  const [selectionResult, fitResult, productPhotoResult, auditResult] = await Promise.all([
    supabase.from("canonical_product_images")
      .select("id,product_id,variation_key,source_kind,fit_reference_photo_id,product_photo_evidence_id,source_image_url,photo_quality_score,canonical_locked,lock_reason,selected_at,product:products(name,image_url,brand:brands(name))")
      .order("updated_at", { ascending: false }).limit(100),
    supabase.from("fit_reference_photos")
      .select("id,closet_item_id,storage_path,photo_role,photo_quality_score,canonical_eligible,canonical_ineligible_reason,quality_source,resolution_score,image_width,image_height,created_at,closet:closet_items(product_id,product:products(name,image_url,brand:brands(name)))")
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("product_photo_evidence")
      .select("id,product_id,public_url,source_status,created_at,product:products(name,image_url,brand:brands(name))")
      .neq("source_status", "rejected").order("created_at", { ascending: false }).limit(100),
    supabase.from("canonical_product_image_actions")
      .select("id,product_id,variation_key,action,source_kind,reason,created_at")
      .order("created_at", { ascending: false }).limit(20),
  ]);
  if (selectionResult.error || fitResult.error || productPhotoResult.error || auditResult.error) {
    throw new Error("Could not load canonical Product image review data.");
  }

  const selections = (selectionResult.data ?? []) as CanonicalSelection[];
  const fitPhotos = (fitResult.data ?? []) as FitPhotoCandidate[];
  const productPhotos = (productPhotoResult.data ?? []) as ProductPhotoCandidate[];
  const audit = (auditResult.data ?? []) as ImageAudit[];
  const closetIds = [...new Set(fitPhotos.map((photo) => photo.closet_item_id))];
  const fitPhotoIds = fitPhotos.map((photo) => photo.id);

  const [variationResult, reportResult, signedResult] = await Promise.all([
    closetIds.length
      ? supabase.from("fit_reports").select("closet_item_id,tracked_variation_key,created_at").in("closet_item_id", closetIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    fitPhotoIds.length
      ? supabase.from("content_reports").select("target_id").eq("target_type", "fit_reference_photo").eq("status", "open").in("target_id", fitPhotoIds)
      : Promise.resolve({ data: [], error: null }),
    fitPhotos.length
      ? supabase.storage.from("fit-reference-photos").createSignedUrls(fitPhotos.map((photo) => photo.storage_path), 1800)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (variationResult.error || reportResult.error || signedResult.error) {
    throw new Error("Could not load canonical Fit Photo context.");
  }

  const variationByCloset = new Map<string, string>();
  for (const row of (variationResult.data ?? []) as FitReportVariation[]) {
    if (row.tracked_variation_key && !variationByCloset.has(row.closet_item_id)) variationByCloset.set(row.closet_item_id, row.tracked_variation_key);
  }
  const flaggedFitPhotos = new Set((reportResult.data ?? []).map((row) => row.target_id as string));
  const signedFitPhotoUrls = new Map<string, string>();
  (signedResult.data ?? []).forEach((row, index) => {
    const photo = fitPhotos[index];
    if (photo && row?.signedUrl) signedFitPhotoUrls.set(photo.id, row.signedUrl);
  });
  const selectionBySource = new Map<string, CanonicalSelection[]>();
  for (const selection of selections) {
    const sourceId = selection.fit_reference_photo_id || selection.product_photo_evidence_id;
    if (!sourceId) continue;
    const list = selectionBySource.get(sourceId) ?? [];
    list.push(selection);
    selectionBySource.set(sourceId, list);
  }

  return <section>
    <h2>Canonical Product images</h2>
    <p className="fieldHelp">Roadmap 13A keeps one Product-image winner per Product and tracked variation. Eligible real Fit Report photos outrank Product/official imagery automatically, the current Fit Photo changes only for a meaningfully better score, and an admin lock always wins.</p>

    <div className={styles.queue}>
      {selections.length ? selections.map((selection) => {
        const product = one<Product>(selection.product);
        return <article className={styles.report} key={selection.id}>
          <strong>{productLabel(selection.product)}</strong>
          <div className={styles.meta}>
            <span>{variationLabel(selection.variation_key)}</span>
            <span>{sourceLabel(selection.source_kind)}</span>
            {selection.photo_quality_score !== null ? <span>Score {selection.photo_quality_score}</span> : null}
            <span>{selection.canonical_locked ? "Locked" : "Automatic"}</span>
          </div>
          {selection.lock_reason ? <p>Lock reason: {selection.lock_reason}</p> : null}
          {selection.canonical_locked ? <form className={styles.actions} action={unlockCanonicalProductImage}>
            <input type="hidden" name="product_id" value={selection.product_id}/>
            <input type="hidden" name="variation_key" value={selection.variation_key ?? ""}/>
            <input name="reason" required maxLength={500} placeholder="Why this image should return to automatic selection"/>
            <button className={styles.dismiss}>Unlock Product Image</button>
          </form> : null}
          {!selection.variation_key && product?.image_url ? <form className={styles.actions} action={setCanonicalProductImage}>
            <input type="hidden" name="product_id" value={selection.product_id}/>
            <input type="hidden" name="variation_key" value=""/>
            <input type="hidden" name="source_kind" value="official_product_image"/>
            <input name="reason" required maxLength={500} placeholder="Why the official/imported image should represent this Product"/>
            <button className={styles.dismiss} name="lock" value="0">Set as Product Image</button>
            <button className={styles.dismiss} name="lock" value="1">Lock Product Image</button>
          </form> : null}
        </article>;
      }) : <p>No canonical Product image selections exist yet.</p>}
    </div>

    <h3>Fit Report photo candidates</h3>
    <p className="fieldHelp">Technical score is shown for audit context. Open moderation reports, duplicates, explicitly ineligible photos, and extremely low-resolution scored photos are excluded from automatic selection. The original Fit Report photo is never replaced or rewritten.</p>
    {fitPhotos.length ? <div className={styles.queue}>{fitPhotos.map((photo) => {
      const closet = one<Closet>(photo.closet);
      const productId = closet?.product_id ?? null;
      const trackedVariation = variationByCloset.get(photo.closet_item_id) ?? null;
      const sourceSelections = selectionBySource.get(photo.id) ?? [];
      const isFlagged = flaggedFitPhotos.has(photo.id);
      const automaticResolutionEligible = photo.quality_source === "legacy_neutral" || photo.resolution_score >= 50;
      return <article className={styles.report} key={photo.id}>
        {signedFitPhotoUrls.get(photo.id) ? <img className={styles.preview} src={signedFitPhotoUrls.get(photo.id)} alt={`${productLabel(closet?.product)} Fit Report photo`}/> : null}
        <strong>{productLabel(closet?.product)}</strong>
        <div className={styles.meta}>
          <span>{photo.photo_role === "front" ? "Front" : "Back"}</span>
          <span>Score {photo.photo_quality_score}</span>
          <span>Resolution {photo.resolution_score}</span>
          {photo.image_width && photo.image_height ? <span>{photo.image_width}×{photo.image_height}</span> : null}
          <span>{photo.canonical_eligible ? "Eligible" : "Ineligible"}</span>
          {isFlagged ? <span>Open moderation report</span> : null}
          {!automaticResolutionEligible ? <span>Too low-resolution for automatic selection</span> : null}
          {sourceSelections.length ? <span>Current Product image</span> : null}
        </div>
        {photo.canonical_ineligible_reason ? <p>{photo.canonical_ineligible_reason}</p> : null}
        {productId && photo.canonical_eligible && !isFlagged ? <>
          <form className={styles.actions} action={setCanonicalProductImage}>
            <input type="hidden" name="product_id" value={productId}/>
            <input type="hidden" name="variation_key" value=""/>
            <input type="hidden" name="source_kind" value="fit_reference_photo"/>
            <input type="hidden" name="source_id" value={photo.id}/>
            <input name="reason" required maxLength={500} placeholder="Why this Fit Report photo should represent the Product"/>
            <button className={styles.dismiss} name="lock" value="0">Set as Product Image</button>
            <button className={styles.dismiss} name="lock" value="1">Lock Product Image</button>
          </form>
          {trackedVariation ? <form className={styles.actions} action={setCanonicalProductImage}>
            <input type="hidden" name="product_id" value={productId}/>
            <input type="hidden" name="variation_key" value={trackedVariation}/>
            <input type="hidden" name="source_kind" value="fit_reference_photo"/>
            <input type="hidden" name="source_id" value={photo.id}/>
            <input name="reason" required maxLength={500} placeholder="Why this photo should represent this exact tracked variation"/>
            <button className={styles.dismiss} name="lock" value="0">Set for Exact Variation</button>
            <button className={styles.dismiss} name="lock" value="1">Lock Exact Variation</button>
          </form> : null}
        </> : null}
        <form className={styles.actions} action={setFitPhotoCanonicalEligibility}>
          <input type="hidden" name="photo_id" value={photo.id}/>
          <input type="hidden" name="eligible" value={photo.canonical_eligible ? "0" : "1"}/>
          <input name="reason" required maxLength={500} placeholder={photo.canonical_eligible ? "Why this photo is unsuitable for Product imagery" : "Why this photo is safe to return to eligibility"}/>
          <button className={photo.canonical_eligible ? styles.danger : styles.dismiss}>{photo.canonical_eligible ? "Mark Ineligible" : "Mark Eligible"}</button>
        </form>
      </article>;
    })}</div> : <p>No Fit Report photo candidates are available.</p>}

    <h3>Product Photo candidates</h3>
    {productPhotos.length ? <div className={styles.queue}>{productPhotos.map((photo) => <article className={styles.report} key={photo.id}>
      <img className={styles.preview} src={photo.public_url} alt={`${productLabel(photo.product)} Product Photo`}/>
      <strong>{productLabel(photo.product)}</strong>
      <div className={styles.meta}><span>{sourceLabel("product_photo_evidence")}</span><span>{photo.source_status}</span>{selectionBySource.has(photo.id) ? <span>Current Product image</span> : null}</div>
      <form className={styles.actions} action={setCanonicalProductImage}>
        <input type="hidden" name="product_id" value={photo.product_id}/>
        <input type="hidden" name="variation_key" value=""/>
        <input type="hidden" name="source_kind" value="product_photo_evidence"/>
        <input type="hidden" name="source_id" value={photo.id}/>
        <input name="reason" required maxLength={500} placeholder="Why this Product Photo should represent the Product"/>
        <button className={styles.dismiss} name="lock" value="0">Set as Product Image</button>
        <button className={styles.dismiss} name="lock" value="1">Lock Product Image</button>
      </form>
    </article>)}</div> : <p>No Product Photo evidence is available.</p>}

    <div className={styles.history}>
      <h3>Product image audit</h3>
      <ul>{audit.map((item) => <li key={item.id}><strong>{item.action.replaceAll("_", " ")}</strong> · {item.variation_key ? "Exact variation" : "Product"} · {item.source_kind ? sourceLabel(item.source_kind) : "selection"} · {item.reason} · {new Date(item.created_at).toLocaleString()}</li>)}</ul>
    </div>
  </section>;
}
