import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfilePhotoUrl } from "@/lib/profile-photo";
import { createClient } from "@/lib/supabase/server";
import styles from "./closet.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ClosetTab = "garments" | "outfits" | "fituition";
type ClosetRow = { id: string; variant_id: string | null; size_label: string; wears_count: number; product: unknown; submission: unknown };
type ProductView = { id: string; name: string; slug: string; category: string; garment_type_key: string | null; brand: unknown };
type BrandView = { name: string };
type PendingView = { brand_text: string; model_text: string; garment_type_key: string };
type FitReport = { closet_item_id: string; fit: string; would_buy_again: boolean | null; created_at: string };
type FitPhoto = { closet_item_id: string; storage_path: string; photo_role: "front" | "back" };
type UnconfirmedStatus = { closet_item_id: string; candidate_id: string; candidate_status: string; retailer_url: string | null; has_product_photo: boolean; has_label_photo: boolean };
type Profile = { username: string; display_name: string | null; avatar_url: string | null };
type OutfitRow = { id: string; headline: string | null; status: "draft" | "published"; published_at: string | null; created_at: string; like_count: number; comment_count: number };
type OutfitPhoto = { post_id: string; bucket: "outfit-photos" | "outfit-draft-photos"; display_path: string; sort_order: number; is_main: boolean };

const FIT_LABELS: Record<string, string> = { too_small: "Too small", snug: "Snug", just_right: "Just right", relaxed: "Relaxed", too_big: "Too big" };
const CATEGORY_LABELS: Record<string, string> = { tops: "Tops", bottoms: "Bottoms", dresses: "Dresses", outerwear: "Outerwear", shoes: "Shoes", swimwear: "Swimwear", intimates: "Intimates", sleepwear_lingerie: "Sleepwear & Lingerie", other: "Other" };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }
function closetTab(value: string | undefined): ClosetTab { return value === "outfits" || value === "fituition" ? value : "garments"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

export default async function ClosetPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = closetTab(first(params.tab));
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect(`/login?next=${encodeURIComponent(tab === "garments" ? "/closet" : `/closet?tab=${tab}`)}`);

  const { data: profileData, error: profileError } = await supabase.from("profiles").select("username,display_name,avatar_url").eq("id", userId).maybeSingle();
  if (profileError || !profileData?.username) redirect("/onboarding");
  const profile = profileData as Profile;
  const profilePhoto = currentProfilePhotoUrl(supabase, profile.avatar_url);
  const displayName = profile.display_name?.trim() || profile.username;

  const tabs = <nav className={styles.tabs} aria-label="My Closet sections">
    <Link className={`${styles.tab} ${tab === "garments" ? styles.active : ""}`} href="/closet">Garments</Link>
    <Link className={`${styles.tab} ${tab === "outfits" ? styles.active : ""}`} href="/closet?tab=outfits">Outfits</Link>
    <Link className={`${styles.tab} ${tab === "fituition" ? styles.active : ""}`} href="/closet?tab=fituition">FITuition</Link>
  </nav>;

  if (tab === "outfits") {
    const { data: outfitData, error: outfitError } = await supabase.from("outfit_posts").select("id,headline,status,published_at,created_at,like_count,comment_count").eq("user_id", userId).order("created_at", { ascending: false });
    if (outfitError) throw new Error("Could not load your Outfits.");
    const outfits = (outfitData ?? []) as OutfitRow[];
    const postIds = outfits.map((outfit) => outfit.id);
    let photoRows: OutfitPhoto[] = [];
    if (postIds.length) {
      const { data, error } = await supabase.from("outfit_photos").select("post_id,bucket,display_path,sort_order,is_main").in("post_id", postIds).order("sort_order");
      if (error) throw new Error("Could not load your Outfit photos.");
      photoRows = (data ?? []) as OutfitPhoto[];
    }
    const coverByPost = new Map<string, OutfitPhoto>();
    for (const photo of [...photoRows].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order)) if (!coverByPost.has(photo.post_id)) coverByPost.set(photo.post_id, photo);
    const photoByPost = new Map<string, string>();
    await Promise.all(outfits.map(async (outfit) => {
      const cover = coverByPost.get(outfit.id);
      if (!cover) return;
      if (cover.bucket === "outfit-photos") {
        photoByPost.set(outfit.id, supabase.storage.from("outfit-photos").getPublicUrl(cover.display_path).data.publicUrl);
        return;
      }
      const { data } = await supabase.storage.from("outfit-draft-photos").createSignedUrl(cover.display_path, 60 * 30);
      if (data?.signedUrl) photoByPost.set(outfit.id, data.signedUrl);
    }));

    return <main className="pageShell">
      <div className="pageTitle"><span className="eyebrow">MY CLOSET</span><h1>Everything you wear, in one place.</h1></div>
      {tabs}
      {first(params.deleted) === "1" ? <div className="authMessage">Outfit deleted.</div> : null}
      <div className={styles.outfitHeader}><div><strong>Your Outfits</strong><p className="muted">Published looks and drafts you’re still working on.</p></div><Link className="primaryButton" href="/outfits/new">+ New Outfit</Link></div>
      {outfits.length ? <div className={styles.outfitGrid}>{outfits.map((outfit) => {
        const photo = photoByPost.get(outfit.id);
        const href = outfit.status === "draft" ? `/outfits/new?draft=${outfit.id}` : `/outfits/${outfit.id}`;
        return <article className={styles.outfitCard} key={outfit.id}>
          <Link className={styles.outfitPhotoLink} href={href}>{photo ? <img src={photo} alt={outfit.headline || "Outfit"}/> : <span className={styles.outfitPhotoFallback}>{outfit.status === "draft" ? "Draft Outfit" : "Outfit photo unavailable"}</span>}</Link>
          <div className={styles.outfitBody}>
            <div className={styles.ownerIdentity}>{profilePhoto ? <img className={styles.ownerAvatar} src={profilePhoto} alt=""/> : <span className={styles.ownerAvatarFallback}>{displayName.slice(0, 1).toUpperCase()}</span>}<span>{displayName}</span></div>
            <div className={styles.outfitMeta}><span className={styles.status}>{outfit.status}</span><span>{formatDate(outfit.published_at || outfit.created_at)}</span></div>
            <Link className={styles.outfitTitle} href={href}><strong>{outfit.headline || "Untitled Outfit"}</strong></Link>
            {outfit.status === "published" ? <div className={styles.outfitCounts}><span>♥ {outfit.like_count}</span><span>💬 {outfit.comment_count}</span></div> : <span className="muted">Continue editing this draft.</span>}
          </div>
        </article>;
      })}</div> : <div className="emptyState"><span className="eyebrow">NO OUTFITS YET</span><h2>Build a look from your Closet.</h2><p>Your Outfits live here alongside the garments you own.</p><Link className="primaryButton" href="/outfits/new">Create my first Outfit →</Link></div>}
    </main>;
  }

  if (tab === "fituition") {
    const { count, error } = await supabase.from("closet_items").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (error) throw new Error("Could not load FITuition history.");
    const garmentCount = count ?? 0;
    const strength = Math.min(100, garmentCount * 10);
    const remaining = Math.max(0, 10 - garmentCount);
    return <main className="pageShell">
      <div className="pageTitle"><span className="eyebrow">MY CLOSET</span><h1>Everything you wear, in one place.</h1></div>
      {tabs}
      <section className={styles.fituition}>
        <div className={styles.fituitionCard}><span className="eyebrow">FITuition</span><h2>Your Closet history makes recommendations smarter.</h2><p>FITuition combines the Fit Reports and garment history in your Closet with relevant Size Match evidence when LikeSized recommends a size.</p></div>
        <div className="profileStrength"><div><strong>Fit evidence strength</strong><span>{garmentCount} garment{garmentCount === 1 ? "" : "s"} logged{remaining > 0 ? ` · Add ${remaining} more for stronger recommendations` : " · Strong V1 fit history"}</span></div><div className="meter"><span style={{ width: `${strength}%` }} /></div><b>{strength}%</b></div>
        <div><Link className="primaryButton" href="/closet/add">+ Add Fit Report</Link></div>
      </section>
    </main>;
  }

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

  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET</span><h1>Everything you wear, in one place.</h1></div><Link className="primaryButton" href="/closet/add">+ Add garment</Link></div>
    {tabs}
    {added ? <div className="authMessage">Garment added to your Closet.</div> : null}
    {deleted ? <div className="authMessage">Garment and its fit history removed.</div> : null}
    {evidenceAdded ? <div className="authMessage">Thanks — your added item information was sent back for review.</div> : null}

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
