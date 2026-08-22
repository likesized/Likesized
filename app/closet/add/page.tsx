import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { CatalogColorField, CatalogGarmentFields, CatalogManualIdentifiers } from "@/app/closet/add/CatalogGarmentFields";
import { GarmentSizeFields } from "@/app/closet/add/GarmentSizeFields";
import { EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function one<T>(value: unknown): T | null { return Array.isArray(value) ? ((value[0] as T | undefined) ?? null) : ((value as T | null) ?? null); }

export default async function AddGarmentPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=/closet/add");
  const params = await searchParams;
  const fixtureMode = allowExploreFixtures(first(params.preview) === "fixtures");
  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name").limit(300),
    supabase.from("products").select("id,name,garment_type_key,manufacturer_style_number,brand:brands(name)").neq("catalog_status", "rejected").order("name").limit(300),
  ]);
  const catalogProducts = [
    ...(fixtureMode ? EXPLORE_FIXTURE_PRODUCTS.map((product) => ({ id: product.id, name: product.name, brand_name: product.brand.name, garment_type_key: product.garment_type_key, manufacturer_style_number: null })) : []),
    ...(products ?? []).map((product) => ({ id: product.id, name: product.name, brand_name: one<{ name: string }>(product.brand)?.name ?? "", garment_type_key: product.garment_type_key, manufacturer_style_number: product.manufacturer_style_number })),
  ];
  const brandOptions = [...(brands ?? [])];
  if (fixtureMode) for (const product of EXPLORE_FIXTURE_PRODUCTS) if (!brandOptions.some((brand) => brand.name === product.brand.name)) brandOptions.push({ id: product.brand_id, name: product.brand.name });
  brandOptions.sort((a, b) => a.name.localeCompare(b.name));
  const error = first(params.error);
  const errorMessage = error === "invalid_fields" ? "Check the required item, size, fit, condition, and controlled details, then try again." : error === "invalid_photo" ? "Fit photo must be JPEG, PNG, or WebP and no larger than 8 MB." : error === "save_failed" ? "That Fit Report could not be saved." : null;

  return <main className="pageShell addGarmentShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · NEW FIT REPORT</span><h1>Share how an item actually fits.</h1><p>LikeSized asks only for information that identifies the item and makes its Fit Report useful.</p></div><Link className="secondaryButton" href="/closet">Back to My Closet</Link></div>
    <form className="garmentForm" action={fixtureMode ? undefined : addGarment}>
      {fixtureMode ? <div className="authMessage"><b>Owner-review test environment.</b> Temporary garment choices are labeled through the preview and this form cannot save or write to Supabase.</div> : null}
      {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}
      <CatalogGarmentFields brands={brandOptions} products={catalogProducts}>
      <CatalogColorField />
      <GarmentSizeFields />
      <CatalogManualIdentifiers />
      <label>Overall Fit Result<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select><span className="fieldHelp">Bad fits are useful evidence too.</span></label>
      <label>Garment condition<select name="reported_condition" defaultValue="" required><option value="" disabled>Select condition</option><option value="new">New</option><option value="used">Used</option><option value="altered">Altered</option></select><span className="fieldHelp">Altered items stay in Fit History but are not treated as normal sizing evidence for other people.</span></label>
      <label>Fit photo <span className="muted inlineMuted">optional</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp"><b>Fit photos are shared with the LikeSized community. Don’t upload a photo you do not want other people to see.</b></span></label>
      <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={5} placeholder="Roomy in the thighs, right at the waist..." /></label>
      <button className="primaryButton fullButton" type="submit" disabled={fixtureMode}>{fixtureMode ? "Preview only — saving disabled" : "Add Fit Report →"}</button>
      </CatalogGarmentFields>
    </form>
  </main>;
}
