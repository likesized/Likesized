import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ClosetRow = { id: string; size_label: string; wears_count: number; visibility: "private" | "shared"; product: unknown };
type ProductView = { id: string; name: string; slug: string; category: string; garment_type_key: string | null; brand: unknown };
type BrandView = { name: string };
type FitReport = { closet_item_id: string; fit: string; would_buy_again: boolean | null };
type FitPhoto = { closet_item_id: string; storage_path: string };

const FIT_LABELS: Record<string,string> = { too_small:"Too small", snug:"Snug", just_right:"Just right", relaxed:"Relaxed", too_big:"Too big" };
const CATEGORY_LABELS: Record<string,string> = { tops:"Tops", bottoms:"Bottoms", dresses:"Dresses", outerwear:"Outerwear", shoes:"Shoes", other:"Other" };
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function ClosetPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login?next=/closet");
  const params = await searchParams;
  const added = first(params.added) === "1";

  const { data, error } = await supabase.from("closet_items").select("id,size_label,wears_count,visibility,product:products(id,name,slug,category,garment_type_key,brand:brands(name))").eq("user_id", userId).order("created_at", { ascending:false });
  if (error) throw new Error("Could not load Closet.");
  const items = (data ?? []) as ClosetRow[];
  const ids = items.map((item) => item.id);
  let reports: FitReport[] = [];
  let photos: FitPhoto[] = [];
  if (ids.length) {
    const [{ data: reportData, error: reportError }, { data: photoData, error: photoError }] = await Promise.all([
      supabase.from("fit_reports").select("closet_item_id,fit,would_buy_again").in("closet_item_id", ids),
      supabase.from("fit_reference_photos").select("closet_item_id,storage_path").in("closet_item_id", ids),
    ]);
    if (reportError || photoError) throw new Error("Could not load Closet evidence.");
    reports = (reportData ?? []) as FitReport[];
    photos = (photoData ?? []) as FitPhoto[];
  }
  const reportByItem = new Map(reports.map((row) => [row.closet_item_id,row]));
  const photoByItem = new Map(photos.map((row) => [row.closet_item_id,row.storage_path]));
  const signedPhotos = new Map<string,string>();
  await Promise.all(items.map(async (item) => {
    const path = photoByItem.get(item.id); if (!path) return;
    const { data: signed } = await supabase.storage.from("fit-reference-photos").createSignedUrl(path, 60*30);
    if (signed?.signedUrl) signedPhotos.set(item.id,signed.signedUrl);
  }));

  const garmentCount = items.length;
  const strength = Math.min(100,garmentCount*10);
  const remaining = Math.max(0,10-garmentCount);
  return <main className="pageShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET</span><h1>Teach LikeSized what fits you.</h1></div><Link className="primaryButton" href="/closet/add">+ Add garment</Link></div>
    {added ? <div className="authMessage">Garment added to your Closet.</div> : null}
    <div className="profileStrength"><div><strong>Fit evidence strength</strong><span>{garmentCount} garment{garmentCount===1?"":"s"} logged{remaining>0?` · Add ${remaining} more for stronger recommendations`:" · Strong V1 fit history"}</span></div><div className="meter"><span style={{width:`${strength}%`}} /></div><b>{strength}%</b></div>
    {items.length ? <div className="tableLike">{items.map((item) => {
      const product = one<ProductView>(item.product); const brand = one<BrandView>(product?.brand); const report = reportByItem.get(item.id); const photo = signedPhotos.get(item.id);
      return <div className="closetRow" key={item.id}>
        {photo ? <img className="garmentPhoto" src={photo} alt="Fit reference" /> : <div className="garmentThumb">{(brand?.name||"?").slice(0,1).toUpperCase()}</div>}
        <div className="closetMain"><span className="muted">{brand?.name||"Brand"}</span><strong>{product?.name||"Garment"}</strong><span>{CATEGORY_LABELS[product?.category||""]||"Other"}{product?.garment_type_key ? ` · ${product.garment_type_key.replaceAll("_"," ")}` : ""}</span></div>
        <div><span className="muted">SIZE</span><strong>{item.size_label}</strong></div>
        <div><span className="muted">FIT</span><strong>{FIT_LABELS[report?.fit||""]||"—"}</strong></div>
        <div><span className="muted">VISIBILITY</span><strong>{item.visibility === "shared" ? "Shared" : "Private"}</strong></div>
        {product ? <Link className="textLink closetViewLink" href={`/item/${product.slug}`}>View →</Link> : <span className="closetStatus">Logged</span>}
      </div>;
    })}</div> : <div className="emptyState"><span className="eyebrow">YOUR CLOSET IS EMPTY</span><h2>Start with something you already know fits.</h2><p>Log the product, original size and fit. Choose Shared only when you want other members to browse the fit evidence; uploading a Fit Photo automatically shares that item.</p><Link className="primaryButton" href="/closet/add">Add my first garment →</Link></div>}
  </main>;
}
