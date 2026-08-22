import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addBrandAlias,
  addProductAlias,
  createProductFromCandidate,
  dismissCatalogFlag,
  lockCatalogField,
  mapCatalogCandidate,
  removeCanonicalProductPhoto,
  removePendingProductPhoto,
  resolveReport,
  setCandidateStatus,
} from "./actions";
import styles from "./moderation.module.css";

type Report = {
  id: string;
  target_type: "outfit_post" | "fit_reference_photo";
  target_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: unknown;
  reported: unknown;
};
type Profile = { username: string | null; display_name: string | null };
type Action = { id: string; action: string; target_type: string; reason: string; created_at: string };
type CatalogAction = { id: string; action: string; reason: string; created_at: string; candidate_id: string | null; product_id: string | null };
type ProductFlag = { id: string; name: string; garment_type_key: string | null; market_segment: string; brand: unknown };
type Brand = { id?: string; name: string; normalized_name?: string };
type ModeratedContent = { imageUrl: string | null; description: string };
type EvidenceChoice = { value: string; submitted_by: string | null; source_status: string };
type CatalogDispute = {
  kind: "garment_type" | "market_segment" | "attribute" | "description" | "department" | "identity";
  key: string;
  label: string;
  choices: Array<{ value: string; people: number; status: string }>;
};
type Candidate = {
  id: string;
  brand_text: string;
  normalized_brand: string;
  model_text: string;
  normalized_model: string;
  garment_type_key: string;
  department_key: string | null;
  status: string;
  submission_count: number;
  last_submitted_at: string | null;
  last_researched_at: string | null;
};
type Submission = {
  id: string;
  candidate_id: string;
  identifier_type: string | null;
  identifier_value: string | null;
  manufacturer_style_number: string | null;
  retailer_url: string | null;
  department_key: string | null;
  product_photo_storage_path: string | null;
  created_at: string;
};
type ReviewFlag = { id: string; candidate_id: string | null; product_id: string | null; flag_type: string; details: Record<string, unknown>; created_at: string };
type CandidateProduct = { id: string; name: string; normalized_name: string; garment_type_key: string | null; brand: unknown };
type AliasBrand = { id: string; name: string; normalized_name: string };
type PhotoProduct = { name: string; brand: unknown };
type CanonicalProductPhoto = { id: string; product_id: string; storage_path: string; public_url: string; source_status: string; created_at: string; product: unknown };
function one<T>(v: unknown): T | null { return Array.isArray(v) ? ((v[0] as T | undefined) ?? null) : ((v as T | null) ?? null); }
function name(v: unknown) { const p = one<Profile>(v); return p?.display_name?.trim() || p?.username || "Member"; }
function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login?next=/moderation");
  const { data: isAdmin } = await supabase.rpc("is_current_user_admin");
  if (!isAdmin) redirect("/");

  const [
    { data: reports, error },
    { data: history },
    { count: closedCount },
    { data: catalogFlags },
    { data: candidates, error: candidateError },
    { data: openReviewFlags },
    { data: candidateProducts },
    { data: catalogHistory },
    { data: aliasBrandData },
    { data: canonicalPhotoData },
  ] = await Promise.all([
    supabase
      .from("content_reports")
      .select("id,target_type,target_id,reported_user_id,reason,details,status,created_at,reporter:profiles!content_reports_reporter_id_fkey(username,display_name),reported:profiles!content_reports_reported_user_id_fkey(username,display_name)")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase.from("moderation_actions").select("id,action,target_type,reason,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("content_reports").select("id", { count: "exact", head: true }).neq("status", "open"),
    supabase.from("products").select("id,name,garment_type_key,market_segment,brand:brands(name)").eq("catalog_review_needed", true).order("created_at", { ascending: true }),
    supabase.from("catalog_candidates").select("id,brand_text,normalized_brand,model_text,normalized_model,garment_type_key,department_key,status,submission_count,last_submitted_at,last_researched_at").neq("status", "merged").order("submission_count", { ascending: false }).order("last_submitted_at", { ascending: false }).limit(100),
    supabase.from("catalog_review_flags").select("id,candidate_id,product_id,flag_type,details,created_at").eq("status", "open").order("created_at", { ascending: true }),
    supabase.from("products").select("id,name,normalized_name,garment_type_key,brand:brands(id,name,normalized_name)").neq("catalog_status", "rejected").order("name").limit(500),
    supabase.from("catalog_resolution_actions").select("id,action,reason,created_at,candidate_id,product_id").order("created_at", { ascending: false }).limit(30),
    supabase.from("brands").select("id,name,normalized_name").order("name").limit(500),
    supabase.from("product_photo_evidence").select("id,product_id,storage_path,public_url,source_status,created_at,product:products(name,brand:brands(name))").neq("source_status", "rejected").order("created_at", { ascending: false }).limit(100),
  ]);
  if (error || candidateError) throw new Error("Could not load moderation/catalog queues.");

  const rows = (reports ?? []) as Report[];
  const productFlags = (catalogFlags ?? []) as ProductFlag[];
  const candidateRows = (candidates ?? []) as Candidate[];
  const reviewFlags = (openReviewFlags ?? []) as ReviewFlag[];
  const products = (candidateProducts ?? []) as CandidateProduct[];
  const aliasBrands = (aliasBrandData ?? []) as AliasBrand[];
  const canonicalPhotos = (canonicalPhotoData ?? []) as CanonicalProductPhoto[];
  const productById = new Map(products.map((product) => [product.id, product]));
  const candidateById = new Map(candidateRows.map((candidate) => [candidate.id, candidate]));
  const candidateIds = candidateRows.map((candidate) => candidate.id);
  const { data: submissionData } = candidateIds.length
    ? await supabase.from("garment_submissions").select("id,candidate_id,identifier_type,identifier_value,manufacturer_style_number,retailer_url,department_key,product_photo_storage_path,created_at").in("candidate_id", candidateIds).order("created_at", { ascending: false })
    : { data: [] };
  const submissions = (submissionData ?? []) as Submission[];
  const submissionsByCandidate = new Map<string, Submission[]>();
  for (const submission of submissions) {
    const list = submissionsByCandidate.get(submission.candidate_id) ?? [];
    if (list.length < 5) list.push(submission);
    submissionsByCandidate.set(submission.candidate_id, list);
  }
  const flagsByCandidate = new Map<string, ReviewFlag[]>();
  for (const flag of reviewFlags) if (flag.candidate_id) {
    const list = flagsByCandidate.get(flag.candidate_id) ?? [];
    list.push(flag);
    flagsByCandidate.set(flag.candidate_id, list);
  }
  const pendingPhotoUrls = new Map<string, string>();
  await Promise.all(submissions.filter((submission) => submission.product_photo_storage_path).slice(0, 100).map(async (submission) => {
    const path = submission.product_photo_storage_path!;
    const { data } = await supabase.storage.from("catalog-submission-photos").createSignedUrl(path, 1800);
    if (data?.signedUrl) pendingPhotoUrls.set(submission.id, data.signedUrl);
  }));

  const flaggedProductIds = productFlags.map((product) => product.id);
  const [{ data: metadataEvidence }, { data: attributeEvidence }, { data: descriptionEvidence }, { data: identityEvidence }] = flaggedProductIds.length ? await Promise.all([
    supabase.from("product_metadata_evidence").select("product_id,field_key,value_text,source_status,submitted_by").in("product_id", flaggedProductIds).neq("source_status", "rejected"),
    supabase.from("product_attribute_evidence").select("product_id,attribute_key,option_key,source_status,submitted_by").in("product_id", flaggedProductIds).neq("source_status", "rejected"),
    supabase.from("product_description_evidence").select("product_id,description,source_status,submitted_by").in("product_id", flaggedProductIds).neq("source_status", "rejected"),
    supabase.from("product_identity_evidence").select("product_id,field_key,value_text,source_status,submitted_by").in("product_id", flaggedProductIds).neq("source_status", "rejected"),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const disputesByProduct = new Map<string, CatalogDispute[]>();
  function addEvidence(productId: string, kind: CatalogDispute["kind"], key: string, displayLabel: string, choice: EvidenceChoice) {
    const disputes = disputesByProduct.get(productId) ?? [];
    let dispute = disputes.find((item) => item.kind === kind && item.key === key);
    if (!dispute) { dispute = { kind, key, label: displayLabel, choices: [] }; disputes.push(dispute); disputesByProduct.set(productId, disputes); }
    const existing = dispute.choices.find((item) => item.value === choice.value);
    if (existing) {
      if (choice.submitted_by) existing.people += 1;
      if (choice.source_status === "verified") existing.status = "verified";
      else if (choice.source_status === "corroborated" && existing.status !== "verified") existing.status = "corroborated";
    } else dispute.choices.push({ value: choice.value, people: choice.submitted_by ? 1 : 0, status: choice.source_status });
  }
  for (const row of metadataEvidence ?? []) {
    const kind: CatalogDispute["kind"] = row.field_key === "market_segment" ? "market_segment" : row.field_key === "department" ? "department" : "garment_type";
    addEvidence(row.product_id, kind, row.field_key, label(row.field_key), { value: row.value_text, submitted_by: row.submitted_by, source_status: row.source_status });
  }
  for (const row of attributeEvidence ?? []) addEvidence(row.product_id, "attribute", row.attribute_key, label(row.attribute_key), { value: row.option_key, submitted_by: row.submitted_by, source_status: row.source_status });
  for (const row of descriptionEvidence ?? []) addEvidence(row.product_id, "description", "description", "Description", { value: row.description, submitted_by: row.submitted_by, source_status: row.source_status });
  for (const row of identityEvidence ?? []) addEvidence(row.product_id, "identity", row.field_key, label(row.field_key), { value: row.value_text, submitted_by: row.submitted_by, source_status: row.source_status });

  const moderatedContent = new Map<string, ModeratedContent>();
  const outfitIds = rows.filter((row) => row.target_type === "outfit_post").map((row) => row.target_id);
  const fitPhotoIds = rows.filter((row) => row.target_type === "fit_reference_photo").map((row) => row.target_id);
  const [{ data: outfits }, { data: fitPhotos }] = await Promise.all([
    outfitIds.length ? supabase.from("outfit_posts").select("id,photo_url,caption").in("id", outfitIds) : Promise.resolve({ data: [] }),
    fitPhotoIds.length ? supabase.from("fit_reference_photos").select("id,storage_path").in("id", fitPhotoIds) : Promise.resolve({ data: [] }),
  ]);
  await Promise.all([
    ...(outfits ?? []).map(async (post) => {
      const feedPath = post.photo_url.replace(/\/display\.webp$/, "/feed.webp");
      let { data } = await supabase.storage.from("outfit-photos").createSignedUrl(feedPath, 1800);
      if (!data?.signedUrl && feedPath !== post.photo_url) ({ data } = await supabase.storage.from("outfit-photos").createSignedUrl(post.photo_url, 1800));
      moderatedContent.set(`outfit_post:${post.id}`, { imageUrl: data?.signedUrl ?? null, description: post.caption?.trim() || "Outfit post" });
    }),
    ...(fitPhotos ?? []).map(async (photo) => {
      const { data } = await supabase.storage.from("fit-reference-photos").createSignedUrl(photo.storage_path, 1800);
      moderatedContent.set(`fit_reference_photo:${photo.id}`, { imageUrl: data?.signedUrl ?? null, description: "Shared Fit Report photo" });
    }),
  ]);

  return <main className="pageShell">
    <div className="pageTitle"><span className="eyebrow">ADMIN</span><h1>Catalog + moderation</h1><p>Resolve high-demand unknown garments, review catalog conflicts and duplicates, and moderate member content from one authorized surface.</p></div>
    <section className={styles.summary}>
      <div><strong>{candidateRows.length}</strong><span>Pending catalog candidates</span></div>
      <div><strong>{reviewFlags.length + productFlags.length}</strong><span>Open catalog flags</span></div>
      <div><strong>{rows.length}</strong><span>Open content reports</span></div>
      <div><strong>{closedCount ?? 0}</strong><span>Resolved content reports</span></div>
    </section>

    <section>
      <h2>Catalog enrichment</h2>
      <p className="fieldHelp">Candidates are prioritized by member demand. Mapping or creating a Product reconnects the existing Closet/Fit Reports without changing their historical body or Fit Result evidence.</p>
      {candidateRows.length ? <div className={styles.queue}>{candidateRows.map((candidate) => {
        const evidence = submissionsByCandidate.get(candidate.id) ?? [];
        const candidateFlags = flagsByCandidate.get(candidate.id) ?? [];
        const matchingProducts = products
          .filter((product) => product.garment_type_key === candidate.garment_type_key)
          .map((product) => ({ product, brand: one<Brand>(product.brand) }))
          .filter(({ brand }) => brand?.normalized_name === candidate.normalized_brand)
          .sort((a, b) => Number(b.product.normalized_name === candidate.normalized_model) - Number(a.product.normalized_name === candidate.normalized_model))
          .slice(0, 20);
        return <article className={styles.report} key={candidate.id}>
          <strong>{candidate.brand_text} · {candidate.model_text}</strong>
          <div className={styles.meta}><span>{label(candidate.garment_type_key)}</span><span>{label(candidate.status)}</span><span>{candidate.submission_count} member submission{candidate.submission_count === 1 ? "" : "s"}</span><span>Last added {candidate.last_submitted_at ? new Date(candidate.last_submitted_at).toLocaleString() : "—"}</span></div>
          {candidateFlags.length ? <div className={styles.dispute}><h3>Open flags</h3>{candidateFlags.map((flag) => <div key={flag.id}>
            <p><b>{label(flag.flag_type)}</b> · {typeof flag.details.reason === "string" ? flag.details.reason : "Review evidence"}</p>
            <form className={styles.actions} action={dismissCatalogFlag}>
              <input type="hidden" name="flag_id" value={flag.id}/>
              <input name="reason" required maxLength={500} placeholder="Why this flag is false or no longer needs review"/>
              <button className={styles.dismiss}>Dismiss flag</button>
            </form>
          </div>)}</div> : null}
          {evidence.length ? <div className={styles.dispute}><h3>Recent member evidence</h3>{evidence.map((submission) => <div key={submission.id}>
            {pendingPhotoUrls.get(submission.id) ? <>
              <img className={styles.preview} src={pendingPhotoUrls.get(submission.id)} alt="Member product-only submission"/>
              <form className={styles.actions} action={removePendingProductPhoto}>
                <input type="hidden" name="submission_id" value={submission.id}/>
                <input name="reason" required maxLength={500} placeholder="Required reason to remove this Product Photo"/>
                <button className={styles.danger}>Remove Product Photo</button>
              </form>
            </> : null}
            <p>{submission.identifier_value ? `${label(submission.identifier_type || "identifier")}: ${submission.identifier_value} · ` : ""}{submission.manufacturer_style_number ? `Style: ${submission.manufacturer_style_number} · ` : ""}{submission.department_key ? `Department: ${label(submission.department_key)} · ` : ""}{submission.retailer_url ? "Retail link supplied" : ""}</p>
          </div>)}</div> : null}

          {matchingProducts.length ? <form className={styles.actions} action={mapCatalogCandidate}>
            <input type="hidden" name="candidate_id" value={candidate.id}/>
            <select name="product_id" required defaultValue=""><option value="" disabled>Map to an existing canonical Product</option>{matchingProducts.map(({ product, brand }) => <option key={product.id} value={product.id}>{brand?.name || "Brand"} · {product.name}</option>)}</select>
            <input name="reason" required maxLength={500} placeholder="Why these submissions belong to this Product"/>
            <button className={styles.dismiss}>Map to Product</button>
          </form> : <p className="fieldHelp">No same-brand/same-type canonical Product candidate was found. Create one only after identity review.</p>}

          <form className={styles.actions} action={createProductFromCandidate}>
            <input type="hidden" name="candidate_id" value={candidate.id}/>
            <input name="canonical_name" required maxLength={180} defaultValue={candidate.model_text} aria-label="Canonical Product name"/>
            <input name="reason" required maxLength={500} placeholder="Evidence supporting creation of one new canonical Product"/>
            <button className={styles.dismiss}>Create verified Product + map</button>
          </form>

          <form className={styles.actions} action={setCandidateStatus}>
            <input type="hidden" name="candidate_id" value={candidate.id}/>
            <select name="candidate_status" required defaultValue={candidate.status === "needs_review" || candidate.status === "needs_enrichment" ? candidate.status : "pending"}><option value="pending">Pending Product</option><option value="needs_enrichment">Needs Enrichment</option><option value="needs_review">Needs Review</option></select>
            <input name="reason" required maxLength={500} placeholder="Status/review note"/>
            <button className={styles.dismiss}>Update queue status</button>
          </form>
        </article>;
      })}</div> : <div className="emptyState"><h2>No pending catalog candidates.</h2><p>Unknown member garments will appear here without becoming duplicate Products.</p></div>}
    </section>

    <section>
      <h2>Possible duplicates / identity review</h2>
      <p className="fieldHelp">Flags are review evidence only. Dismissal is audited and never merges or rewrites Product truth.</p>
      {reviewFlags.length ? <div className={styles.queue}>{reviewFlags.map((flag) => {
        const candidate = flag.candidate_id ? candidateById.get(flag.candidate_id) : null;
        const product = flag.product_id ? productById.get(flag.product_id) : null;
        const productBrand = product ? one<Brand>(product.brand) : null;
        const target = candidate
          ? `${candidate.brand_text} · ${candidate.model_text}`
          : product
            ? `${productBrand?.name || "Brand"} · ${product.name}`
            : "Catalog evidence";
        return <article className={styles.report} key={flag.id}>
          <strong>{target}</strong>
          <div className={styles.meta}><span>{label(flag.flag_type)}</span><span>{new Date(flag.created_at).toLocaleString()}</span></div>
          <p>{typeof flag.details.reason === "string" ? flag.details.reason : "Review the linked identity evidence before resolving this flag."}</p>
          <form className={styles.actions} action={dismissCatalogFlag}>
            <input type="hidden" name="flag_id" value={flag.id}/>
            <input name="reason" required maxLength={500} placeholder="Why this flag can be dismissed"/>
            <button className={styles.dismiss}>Dismiss flag</button>
          </form>
        </article>;
      })}</div> : <p>No open catalog review flags.</p>}
    </section>

    <section className={styles.history}>
      <h2>Conflicting Product facts</h2>
      {productFlags.length ? <div className={styles.queue}>{productFlags.map((product) => {
        const brand = one<Brand>(product.brand);
        const disputes = disputesByProduct.get(product.id) ?? [];
        return <article className={styles.report} key={product.id}>
          <strong>{brand?.name || "Brand"} · {product.name}</strong>
          <p>Current type: {product.garment_type_key || "Missing"} · Current segment: {product.market_segment}</p>
          {disputes.map((dispute) => <div className={styles.dispute} key={`${dispute.kind}:${dispute.key}`}>
            <h3>{dispute.label}</h3>
            <ul>{dispute.choices.map((choice) => <li key={choice.value}><b>{choice.value}</b> · {choice.people} {choice.people === 1 ? "person" : "people"} · {label(choice.status)}</li>)}</ul>
            {dispute.kind === "department" || dispute.kind === "identity"
              ? <p className="fieldHelp">This flag stays open for the canonical identity/duplicate review tools.</p>
              : <form className={styles.actions} action={lockCatalogField}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="field_kind" value={dispute.kind}/><input type="hidden" name="field_key" value={dispute.key}/><select name="locked_value" required defaultValue=""><option value="" disabled>Choose the correct final value</option>{dispute.choices.map((choice) => <option value={choice.value} key={choice.value}>{choice.value}</option>)}</select><input name="reason" required maxLength={500} placeholder="Why this is the final value"/><button className={styles.dismiss}>Lock decision</button></form>}
          </div>)}
          {!disputes.length ? <p>Evidence details are unavailable; keep this flag open until the source values can be reviewed.</p> : null}
        </article>;
      })}</div> : <p>No disputed canonical Product fields need review.</p>}
    </section>

    <section>
      <h2>Reviewed aliases</h2>
      <p className="fieldHelp">Aliases resolve alternate spelling/model wording back to one canonical Brand or Product. They do not create another public identity.</p>
      <div className={styles.queue}>
        <article className={styles.report}>
          <strong>Add Brand alias</strong>
          <form className={styles.actions} action={addBrandAlias}>
            <select name="brand_id" required defaultValue=""><option value="" disabled>Choose canonical Brand</option>{aliasBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select>
            <input name="alias" required maxLength={120} placeholder="Reviewed alternate Brand spelling"/>
            <input name="reason" required maxLength={500} placeholder="Why this alias is equivalent"/>
            <button className={styles.dismiss}>Add Brand alias</button>
          </form>
        </article>
        <article className={styles.report}>
          <strong>Add Product alias</strong>
          <form className={styles.actions} action={addProductAlias}>
            <select name="product_id" required defaultValue=""><option value="" disabled>Choose canonical Product</option>{products.map((product) => {
              const brand = one<Brand>(product.brand);
              return <option key={product.id} value={product.id}>{brand?.name || "Brand"} · {product.name}</option>;
            })}</select>
            <input name="alias" required maxLength={180} placeholder="Reviewed alternate Item / Model wording"/>
            <input name="reason" required maxLength={500} placeholder="Why this alias is equivalent"/>
            <button className={styles.dismiss}>Add Product alias</button>
          </form>
        </article>
      </div>
    </section>

    <section>
      <h2>Product Photo moderation</h2>
      <p className="fieldHelp">Pending member Product Photos can be removed directly from their candidate above. Canonical Product-photo evidence remains separate from personal Fit Photos and is removed only with an audited admin reason.</p>
      {canonicalPhotos.length ? <div className={styles.queue}>{canonicalPhotos.map((photo) => {
        const product = one<PhotoProduct>(photo.product);
        const brand = product ? one<Brand>(product.brand) : null;
        return <article className={styles.report} key={photo.id}>
          <img className={styles.preview} src={photo.public_url} alt={`${brand?.name || "Brand"} ${product?.name || "Product"}`}/>
          <strong>{brand?.name || "Brand"} · {product?.name || "Product"}</strong>
          <div className={styles.meta}><span>{label(photo.source_status)}</span><span>{new Date(photo.created_at).toLocaleString()}</span></div>
          <form className={styles.actions} action={removeCanonicalProductPhoto}>
            <input type="hidden" name="photo_id" value={photo.id}/>
            <input name="reason" required maxLength={500} placeholder="Required reason to remove this Product Photo"/>
            <button className={styles.danger}>Remove Product Photo</button>
          </form>
        </article>;
      })}</div> : <p>No canonical Product Photos need review.</p>}
    </section>

    <section>
      <h2>Reported / spam content</h2>
      {rows.length ? <div className={styles.queue}>{rows.map((row) => <article className={styles.report} key={row.id}>
        {moderatedContent.get(`${row.target_type}:${row.target_id}`)?.imageUrl
          ? <img className={styles.preview} src={moderatedContent.get(`${row.target_type}:${row.target_id}`)?.imageUrl ?? ""} alt={moderatedContent.get(`${row.target_type}:${row.target_id}`)?.description ?? "Reported member content"}/>
          : <div className={styles.unavailable}>Reported image is no longer available.</div>}
        <strong>{label(row.reason)}</strong>
        <div className={styles.meta}><span>{label(row.target_type)}</span><span>Reported by {name(row.reporter)}</span><span>Content owner: {name(row.reported)}</span><span>{new Date(row.created_at).toLocaleString()}</span></div>
        {row.details ? <p>{row.details}</p> : null}
        <form className={styles.actions} action={resolveReport}>
          <input type="hidden" name="report_id" value={row.id}/><input name="reason" maxLength={500} required placeholder="Required moderation note"/>
          <button className={styles.dismiss} name="moderation_action" value="dismiss_report">Dismiss report</button>
          <button className={styles.danger} name="moderation_action" value="remove_content">Remove content</button>
        </form>
      </article>)}</div> : <div className="emptyState"><h2>No open reports.</h2><p>The content queue is clear.</p></div>}
    </section>

    <section className={styles.history}><h2>Catalog review history</h2><ul>{((catalogHistory ?? []) as CatalogAction[]).map((item) => <li key={item.id}><strong>{label(item.action)}</strong> · {item.reason} · {new Date(item.created_at).toLocaleString()}</li>)}</ul></section>
    <section className={styles.history}><h2>Moderation history</h2><ul>{((history ?? []) as Action[]).map((item) => <li key={item.id}><strong>{label(item.action)}</strong> · {label(item.target_type)} · {item.reason} · {new Date(item.created_at).toLocaleString()}</li>)}</ul></section>
  </main>;
}
