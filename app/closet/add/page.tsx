import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { CatalogGarmentFields } from "@/app/closet/add/CatalogGarmentFields";
import { GarmentSizeFields } from "@/app/closet/add/GarmentSizeFields";
import { COLOR_FAMILIES } from "@/lib/garment-taxonomy";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function AddGarmentPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=/closet/add");
  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name").limit(300),
    supabase.from("products").select("id,name,garment_type_key,manufacturer_style_number,brand:brands(name)").neq("catalog_status", "rejected").order("name").limit(300),
  ]);
  const catalogProducts = (products ?? []).map((product) => ({ id: product.id, name: product.name, brand_name: one<{ name: string }>(product.brand)?.name ?? "", garment_type_key: product.garment_type_key, manufacturer_style_number: product.manufacturer_style_number }));
  const params = await searchParams;
  const error = first(params.error);
  const errorMessage = error === "invalid_fields" ? "Check the required item, size, fit, condition, and controlled details, then try again." : error === "invalid_photo" ? "Fit photo must be JPEG, PNG, or WebP and no larger than 8 MB." : error === "save_failed" ? "That Fit Report could not be saved." : null;

  return <main className="pageShell addGarmentShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · NEW FIT REPORT</span><h1>Share how an item actually fits.</h1><p>LikeSized asks only for information that identifies the item and makes its Fit Report useful.</p></div><Link className="secondaryButton" href="/closet">Back to My Closet</Link></div>
    <form className="garmentForm" action={addGarment}>
      {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}
      <CatalogGarmentFields brands={brands ?? []} products={catalogProducts} />
      <label>Color<select name="color_family" defaultValue="" required><option value="" disabled>Select a color</option>{COLOR_FAMILIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
      <GarmentSizeFields />
      <div className="fieldPair"><label>Product link <span className="muted inlineMuted">optional</span><input name="product_url" type="url" maxLength={1000} placeholder="https://..." /></label><label>Barcode / SKU <span className="muted inlineMuted">optional</span><input name="identifier" maxLength={120} placeholder="Scan or enter if available" /></label></div>
      <label>Overall Fit Result<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select><span className="fieldHelp">Bad fits are useful evidence too.</span></label>
      <label>Garment condition<select name="reported_condition" defaultValue="" required><option value="" disabled>Select condition</option><option value="new">New</option><option value="used">Used</option><option value="altered">Altered</option></select><span className="fieldHelp">Altered items stay in Fit History but are not treated as normal sizing evidence for other people.</span></label>
      <label>Fit photo <span className="muted inlineMuted">optional</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp"><b>Fit photos are shared with the LikeSized community. Don’t upload a photo you do not want other people to see.</b></span></label>
      <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={5} placeholder="Roomy in the thighs, right at the waist..." /></label>
      <button className="primaryButton fullButton" type="submit">Add Fit Report →</button>
    </form>
  </main>;
}
