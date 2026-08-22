import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { CatalogColorField, CatalogCommunityEnrichment, CatalogGarmentFields } from "@/app/closet/add/CatalogGarmentFields";
import { GarmentSizeFields } from "@/app/closet/add/GarmentSizeFields";
import { EXPLORE_FIXTURE_PRODUCTS, allowExploreFixtures } from "@/lib/explore-fixtures";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function AddGarmentPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=/closet/add");
  const params = await searchParams;
  const fixtureMode = allowExploreFixtures(first(params.preview) === "fixtures");
  const [{ data: brands }, { data: materials }, { data: departments }] = await Promise.all([
    supabase.from("brands").select("id,name").order("name").limit(2000),
    supabase.from("materials").select("key,label").order("label"),
    supabase.from("product_departments").select("key,label").order("sort_order"),
  ]);

  const fixtureProducts = fixtureMode ? EXPLORE_FIXTURE_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    brand_name: product.brand.name,
    garment_type_key: product.garment_type_key,
    manufacturer_style_number: null,
    market_segment: "unknown",
    department_key: null,
    image_url: product.image_url,
    attributes: [],
    materials: [],
    identifiers: [],
    listings: [],
  })) : [];

  const brandOptions = [...(brands ?? [])];
  if (fixtureMode) for (const product of EXPLORE_FIXTURE_PRODUCTS) if (!brandOptions.some((brand) => brand.name === product.brand.name)) brandOptions.push({ id: product.brand_id, name: product.brand.name });
  brandOptions.sort((a, b) => a.name.localeCompare(b.name));

  const error = first(params.error);
  const errorMessage = error === "invalid_fields"
    ? "Check the required item, garment details, size, fit, and condition, then try again."
    : error === "invalid_photo"
      ? "Photos must be JPEG, PNG, or WebP and no larger than 8 MB."
      : error === "save_failed"
        ? "That Fit Report could not be saved."
        : null;

  return <main className="pageShell addGarmentShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · NEW FIT REPORT</span><h1>Share how an item actually fits.</h1><p>Answer the required fit details, then add any optional catalog information you know. If a simple item question truly isn’t clear, choose Not sure.</p></div><Link className="secondaryButton" href="/closet">Back to My Closet</Link></div>
    <form className="garmentForm" action={fixtureMode ? undefined : addGarment}>
      {fixtureMode ? <div className="authMessage"><b>Owner-review test environment.</b> Temporary garment choices are labeled through the preview and this form cannot save or write to Supabase.</div> : null}
      {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}
      <CatalogGarmentFields brands={brandOptions} fixtureProducts={fixtureProducts}>
        <CatalogColorField />
        <GarmentSizeFields />
        <label>Overall Fit Result<select name="fit" defaultValue="" required><option value="" disabled>Select physical fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select><span className="fieldHelp">Bad fits are useful evidence too.</span></label>
        <label>Condition<select name="reported_condition" defaultValue="" required><option value="" disabled>Select condition</option><option value="new">New</option><option value="used">Used</option><option value="altered">Altered</option></select><span className="fieldHelp">Altered items stay in Fit History but are not treated as normal sizing evidence for other people.</span></label>
        <label>Fit photo <span className="muted inlineMuted">optional</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp"><b>Fit photos are shared with the LikeSized community. Don’t upload a photo you do not want other people to see.</b></span></label>
        <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={5} placeholder="Roomy in the thighs, right at the waist..." /></label>

        <CatalogCommunityEnrichment materials={(materials ?? []).map((item) => ({ key: item.key, label: item.label }))} departments={(departments ?? []).map((item) => ({ key: item.key, label: item.label }))} />

        <button className="primaryButton fullButton" type="submit" disabled={fixtureMode}>{fixtureMode ? "Preview only — saving disabled" : "Add Fit Report →"}</button>
      </CatalogGarmentFields>
    </form>
  </main>;
}
