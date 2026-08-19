import Link from "next/link";
import { redirect } from "next/navigation";
import { addGarment } from "@/app/closet/actions";
import { GarmentSizeFields } from "@/app/closet/add/GarmentSizeFields";
import { createClient } from "@/lib/supabase/server";
import { GARMENT_MARKET_SEGMENTS } from "@/lib/domain";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function AddGarmentPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=/closet/add");
  const [{ data: garmentTypes }, { data: brands }, { data: products }] = await Promise.all([
    supabase.from("garment_types").select("key, label, category").eq("active", true).order("sort_order"),
    supabase.from("brands").select("id, name").order("name").limit(300),
    supabase.from("products").select("id, name").order("name").limit(300),
  ]);
  const params = await searchParams;
  const error = first(params.error);
  const errorMessage = error === "invalid_fields" ? "Check the controlled garment details and try again." : error === "invalid_photo" ? "Fit photo must be JPEG, PNG, or WebP and no larger than 8 MB." : error === "save_failed" ? "That garment could not be saved." : null;

  return <main className="pageShell addGarmentShell">
    <div className="pageTitle rowTitle"><div><span className="eyebrow">MY CLOSET · ADD GARMENT</span><h1>Log what you actually wear.</h1><p>Search existing catalog data first; LikeSized only creates a canonical record when needed.</p></div><Link className="secondaryButton" href="/closet">Back to Closet</Link></div>
    <form className="garmentForm" action={addGarment}>
      {errorMessage ? <div className="authMessage error">{errorMessage}</div> : null}
      <div className="fieldPair"><label>Brand<input name="brand" list="brand-options" maxLength={120} placeholder="Levi's" required /><datalist id="brand-options">{(brands ?? []).map((brand) => <option value={brand.name} key={brand.id} />)}</datalist><span className="fieldHelp">Existing canonical brands are resolved before creation. Punctuation/case variants normalize to the same search key.</span></label><label>Product / style<input name="product" list="product-options" maxLength={180} placeholder="541 Athletic Taper" required /><datalist id="product-options">{(products ?? []).map((product)=><option value={product.name} key={product.id}/>)}</datalist><span className="fieldHelp">Existing matching products are resolved before a new canonical product is created.</span></label></div>
      <div className="fieldPair"><label>Garment type<select name="garment_type" defaultValue="" required><option value="" disabled>Select garment type</option>{(garmentTypes ?? []).map((type) => <option value={type.key} key={type.key}>{type.label}</option>)}</select></label><label>Market / cut segment<select name="market_segment" defaultValue="unknown">{GARMENT_MARKET_SEGMENTS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select><span className="fieldHelp">Describes the garment sizing/cut system—not your gender identity.</span></label></div>
      <GarmentSizeFields />
      <div className="fieldPair"><label>Manufacturer style / Style ID<input name="style_number" maxLength={100} placeholder="Optional" /></label><label>SKU / UPC / barcode<input name="identifier" maxLength={120} placeholder="Optional identifier" /></label></div>
      <div className="fieldPair"><label>Product URL<input name="product_url" type="url" maxLength={1000} placeholder="https://..." /></label><label>Color / variant<input name="color_label" maxLength={80} placeholder="Optional" /></label></div>
      <div className="fieldPair"><label>Closet visibility<select name="visibility" defaultValue="private"><option value="private">Private</option><option value="shared">Shared with LikeSized members</option></select></label><label>Overall fit<select name="fit" defaultValue="" required><option value="" disabled>Select fit</option><option value="too_small">Too small</option><option value="snug">Snug</option><option value="just_right">Just right</option><option value="relaxed">Relaxed</option><option value="too_big">Too big</option></select></label></div>
      <div className="fieldPair"><label>Would you buy it again?<select name="would_buy_again" defaultValue="unsure"><option value="yes">Yes</option><option value="no">No</option><option value="unsure">Not sure</option></select></label><label>Times worn<input name="wears_count" type="number" min="0" max="100000" step="1" defaultValue="0" /></label></div>
      <label>Add a Fit Photo — Optional<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><span className="fieldHelp"><b>Fit photos are shared with LikeSized members as real-world fit references. Don’t upload a photo you don’t want other members to see.</b></span></label>
      <label>Fit notes <span className="muted inlineMuted">optional</span><textarea name="fit_notes" maxLength={1000} rows={5} placeholder="Roomy in the thighs, right at the waist..." /></label>
      <button className="primaryButton fullButton" type="submit">Add to my Closet →</button>
    </form>
  </main>;
}
